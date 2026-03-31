import type { PrismaClient } from '@prisma/client';
import { CONFIDENCE_MODEL_VERSION } from './confidence-rules';
import {
  scoreBusinessAlignment,
  scoreDispositionDefinition,
  scoreEvidenceQuality,
  scoreExecutionReadiness,
  scoreStabilityConsistency,
  scoreTechnicalAlignment,
} from './confidence-scoring';
import { loadConfidenceContext, upsertHorizonAssessment } from './confidence-repository';
import {
  clampScore,
  deriveConfidenceBand,
  isAssessmentStale,
  roundScore,
} from './confidence-utils';
import type {
  ApplicationConfidenceResponse,
  ConfidenceContext,
  ConfidenceFactorResult,
  ConfidenceHorizon,
  HorizonConfidenceResult,
} from './confidence-types';

export class ConfidenceEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async calculateOnly(applicationId: string): Promise<ApplicationConfidenceResponse> {
    const context = await loadConfidenceContext(this.prisma, applicationId);

    return {
      applicationId,
      tsa: this.calculateHorizon(context, 'TSA'),
      longTerm: this.calculateHorizon(context, 'LONG_TERM'),
    };
  }

  async calculateAndPersist(applicationId: string): Promise<ApplicationConfidenceResponse> {
    const context = await loadConfidenceContext(this.prisma, applicationId);

    const tsa = this.calculateHorizon(context, 'TSA');
    const longTerm = this.calculateHorizon(context, 'LONG_TERM');

    await upsertHorizonAssessment(this.prisma, applicationId, tsa);
    await upsertHorizonAssessment(this.prisma, applicationId, longTerm);

    return {
      applicationId,
      tsa,
      longTerm,
    };
  }

  private calculateHorizon(
    context: ConfidenceContext,
    horizon: ConfidenceHorizon,
  ): HorizonConfidenceResult {
    const now = new Date();
    const existing = context.existingAssessments.find((item) => item.horizonType === horizon);

    const factorScores: ConfidenceFactorResult[] = [
      scoreDispositionDefinition(context, horizon),
      scoreEvidenceQuality(context, horizon),
      scoreBusinessAlignment(context, horizon),
      scoreTechnicalAlignment(context, horizon),
      scoreExecutionReadiness(context, horizon),
      scoreStabilityConsistency(context, horizon),
    ];

    const calculatedScore = roundScore(
      factorScores.reduce((sum, factor) => sum + factor.weightedScore, 0),
    );

    const manualAdjustment = existing?.manualAdjustment ?? 0;
    const finalScore = clampScore(calculatedScore + manualAdjustment);
    const reviewedAt = existing?.reviewedAt ?? null;

    return {
      horizonType: horizon,
      calculatedScore,
      manualAdjustment,
      finalScore,
      confidenceBand: deriveConfidenceBand(finalScore),
      assessmentStatus: existing?.assessmentStatus ?? 'SYSTEM_CALCULATED',
      scoringModelVersion: CONFIDENCE_MODEL_VERSION,
      isStale: isAssessmentStale(reviewedAt, now),
      calculatedAt: now,
      reviewedAt,
      reviewerName: existing?.reviewerName ?? null,
      reviewNotes: existing?.reviewNotes ?? null,
      overrideReason: existing?.overrideReason ?? null,
      factorScores,
    };
  }
}
