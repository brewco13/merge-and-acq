import type { PrismaClient } from '@prisma/client';
import { deriveConfidenceBand, selectAuthoritativeOwnership } from './confidence-utils';
import type {
  ConfidenceBand,
  ConfidenceAssessmentStatus,
  ConfidenceContext,
  ConfidenceHorizon,
  HorizonConfidenceResult,
  OwnershipSnapshot,
} from './confidence-types';

export async function loadConfidenceContext(
  prisma: PrismaClient,
  applicationId: string,
): Promise<ConfidenceContext> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      Ownership: true,
      DispositionDecision: {
        include: {
          DecisionCandidateApplication: true,
        },
      },
      Note: true,
      ConfidenceAssessment: true,
    },
  });

  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  const ownershipRows: OwnershipSnapshot[] = application.Ownership.map((item) => ({
    id: item.id,
    businessOwner: item.businessOwner ?? null,
    technicalOwner: item.technicalOwner ?? null,
    businessDecisionOwner: item.businessDecisionOwner ?? null,
    technicalDecisionOwner: item.technicalDecisionOwner ?? null,
    updatedAt: item.updatedAt,
  }));

  const ownership = selectAuthoritativeOwnership(ownershipRows);

  const dispositions = application.DispositionDecision.map((item) => ({
    id: item.id,
    decisionHorizon: item.decisionHorizon,
    targetDisposition: item.targetDisposition ?? null,
    rationale: item.rationale ?? null,
    targetDate: item.targetDate ?? null,
    targetPlatform: item.targetPlatform ?? null,
    targetTimeline: item.targetTimeline ?? null,
    status: item.status ?? null,
    decisionDate: item.decisionDate ?? null,
    businessReviewStatus: item.businessReviewStatus ?? null,
    businessSignoffStatus: item.businessSignoffStatus ?? null,
    technicalReviewStatus: item.technicalReviewStatus ?? null,
    technicalSignoffStatus: item.technicalSignoffStatus ?? null,
    reviewedAt: item.reviewedAt ?? null,
    updatedAt: item.updatedAt,
  }));

  const candidateApplications = application.DispositionDecision.flatMap((decision) =>
    decision.DecisionCandidateApplication.map((candidate) => ({
      id: candidate.id,
      decisionId: candidate.decisionId,
      candidateApplicationId: candidate.candidateApplicationId ?? null,
      fitCommentary: candidate.notes ?? null,
      updatedAt: candidate.updatedAt,
    })),
  );

  const notes = application.Note.map((note) => ({
    id: note.id,
    content: note.content,
    source: note.source ?? null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));

  const existingAssessments = application.ConfidenceAssessment.map((assessment) => ({
    horizonType: assessment.horizonType,
    manualAdjustment: assessment.manualAdjustment,
    assessmentStatus: assessment.assessmentStatus,
    reviewerName: assessment.reviewerName ?? null,
    reviewNotes: assessment.reviewNotes ?? null,
    overrideReason: assessment.overrideReason ?? null,
    reviewedAt: assessment.reviewedAt ?? null,
  }));

  return {
    application: {
      id: application.id,
      name: application.name,
    },
    ownership,
    dispositions,
    notes,
    candidateApplications,
    existingAssessments,
  };
}

export async function upsertHorizonAssessment(
  prisma: PrismaClient,
  applicationId: string,
  result: HorizonConfidenceResult,
): Promise<void> {
  const existing = await prisma.confidenceAssessment.findUnique({
    where: {
      applicationId_horizonType: {
        applicationId,
        horizonType: result.horizonType,
      },
    },
  });

  const preservedManualAdjustment = existing?.manualAdjustment ?? 0;
  const preservedStatus = existing?.assessmentStatus ?? result.assessmentStatus;
  const preservedReviewerName = existing?.reviewerName ?? null;
  const preservedReviewNotes = existing?.reviewNotes ?? null;
  const preservedOverrideReason = existing?.overrideReason ?? null;
  const preservedReviewedAt = existing?.reviewedAt ?? null;

  const recalculatedFinalScore = Math.max(
    0,
    Math.min(100, result.calculatedScore + preservedManualAdjustment),
  );
  const recalculatedBand = deriveConfidenceBand(recalculatedFinalScore);

  const assessment = await prisma.confidenceAssessment.upsert({
    where: {
      applicationId_horizonType: {
        applicationId,
        horizonType: result.horizonType,
      },
    },
    create: {
      applicationId,
      horizonType: result.horizonType,
      calculatedScore: result.calculatedScore,
      manualAdjustment: result.manualAdjustment,
      finalScore: result.finalScore,
      confidenceBand: result.confidenceBand,
      scoringModelVersion: result.scoringModelVersion,
      assessmentStatus: result.assessmentStatus,
      reviewerName: result.reviewerName,
      reviewNotes: result.reviewNotes,
      overrideReason: result.overrideReason,
      isStale: result.isStale,
      calculatedAt: result.calculatedAt,
      reviewedAt: result.reviewedAt,
    },
    update: {
      calculatedScore: result.calculatedScore,
      manualAdjustment: preservedManualAdjustment,
      finalScore: recalculatedFinalScore,
      confidenceBand: recalculatedBand,
      scoringModelVersion: result.scoringModelVersion,
      assessmentStatus: preservedStatus,
      reviewerName: preservedReviewerName,
      reviewNotes: preservedReviewNotes,
      overrideReason: preservedOverrideReason,
      isStale: result.isStale,
      calculatedAt: result.calculatedAt,
      reviewedAt: preservedReviewedAt,
    },
  });

  await Promise.all(
    result.factorScores.map((factor) =>
      prisma.confidenceFactorScore.upsert({
        where: {
          confidenceAssessmentId_factorCode: {
            confidenceAssessmentId: assessment.id,
            factorCode: factor.factorCode,
          },
        },
        create: {
          confidenceAssessmentId: assessment.id,
          factorCode: factor.factorCode,
          rawScore: factor.rawScore,
          weightPercent: factor.weightPercent,
          weightedScore: factor.weightedScore,
          maxScore: factor.maxScore,
          explanation: factor.explanation,
        },
        update: {
          rawScore: factor.rawScore,
          weightPercent: factor.weightPercent,
          weightedScore: factor.weightedScore,
          maxScore: factor.maxScore,
          explanation: factor.explanation,
        },
      }),
    ),
  );
}

export async function updateConfidenceAssessmentReview(
  prisma: PrismaClient,
  args: {
    applicationId: string;
    horizonType: ConfidenceHorizon;
    data: {
      manualAdjustment: number;
      overrideReason: string | null;
      reviewNotes: string | null;
      assessmentStatus: ConfidenceAssessmentStatus;
      reviewerName: string | null;
      reviewedAt: Date | null;
      finalScore: number;
      confidenceBand: ConfidenceBand;
    };
  },
) {
  const { applicationId, horizonType, data } = args;

  return prisma.confidenceAssessment.update({
    where: {
      applicationId_horizonType: {
        applicationId,
        horizonType,
      },
    },
    data: {
      manualAdjustment: data.manualAdjustment,
      overrideReason: data.overrideReason,
      reviewNotes: data.reviewNotes,
      assessmentStatus: data.assessmentStatus,
      reviewerName: data.reviewerName,
      reviewedAt: data.reviewedAt,
      finalScore: data.finalScore,
      confidenceBand: data.confidenceBand,
    },
    include: {
      ConfidenceFactorScore: true,
    },
  });
}
