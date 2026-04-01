import type { MAX_CONFIDENCE_SCORE, MIN_CONFIDENCE_SCORE, 
	      MANUAL_ADJUSTMENT_MIN, MANUAL_ADJUSTMENT_MAX
             } from './confidence-rules';

export type ConfidenceHorizon = 'TSA' | 'LONG_TERM';

export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';

export type ConfidenceAssessmentStatus =
  | 'SYSTEM_CALCULATED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'OVERRIDDEN';

export type ConfidenceFactorCode =
  | 'DISPOSITION_DEFINITION'
  | 'EVIDENCE_QUALITY'
  | 'BUSINESS_ALIGNMENT'
  | 'TECHNICAL_ALIGNMENT'
  | 'EXECUTION_READINESS'
  | 'STABILITY_CONSISTENCY';

export type ReviewStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'REVIEWED'
  | 'SIGNED_OFF';

export type DecisionHorizonDb = 'TSA_EXPIRATION' | 'LONG_TERM';

export interface ConfidenceFactorResult {
  factorCode: ConfidenceFactorCode;
  rawScore: number;
  weightPercent: number;
  weightedScore: number;
  maxScore: number;
  explanation: string;
  helpingSignals: string[];
  loweringSignals: string[];
}

export interface HorizonConfidenceResult {
  horizonType: ConfidenceHorizon;
  calculatedScore: number;
  manualAdjustment: number;
  finalScore: number;
  confidenceBand: ConfidenceBand;
  assessmentStatus: ConfidenceAssessmentStatus;
  scoringModelVersion: string;
  isStale: boolean;
  calculatedAt: Date;
  reviewedAt: Date | null;
  reviewerName: string | null;
  reviewNotes: string | null;
  overrideReason: string | null;
  factorScores: ConfidenceFactorResult[];
}

export interface ApplicationConfidenceResponse {
  applicationId: string;
  tsa: HorizonConfidenceResult;
  longTerm: HorizonConfidenceResult;
}

export interface OwnershipSnapshot {
  id: string;
  businessOwner: string | null;
  technicalOwner: string | null;
  businessDecisionOwner: string | null;
  technicalDecisionOwner: string | null;
  updatedAt: Date;
}

export interface DispositionSnapshot {
  id: string;
  decisionHorizon: DecisionHorizonDb;
  targetDisposition: string | null;
  rationale: string | null;
  targetDate: Date | null;
  targetPlatform: string | null;
  targetTimeline: string | null;
  status: string | null;
  decisionDate: Date | null;
  businessReviewStatus: ReviewStatus | null;
  businessSignoffStatus: ReviewStatus | null;
  technicalReviewStatus: ReviewStatus | null;
  technicalSignoffStatus: ReviewStatus | null;
  reviewedAt: Date | null;
  updatedAt: Date;
}

export interface NoteSnapshot {
  id: string;
  content: string;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateApplicationSnapshot {
  id: string;
  decisionId: string;
  candidateApplicationId: string | null;
  fitCommentary: string | null;
  updatedAt: Date;
}

export interface ExistingAssessmentSnapshot {
  horizonType: ConfidenceHorizon;
  manualAdjustment: number;
  assessmentStatus: ConfidenceAssessmentStatus;
  reviewerName: string | null;
  reviewNotes: string | null;
  overrideReason: string | null;
  reviewedAt: Date | null;
}

export interface ConfidenceContext {
  application: {
    id: string;
    name: string;
  };
  ownership: OwnershipSnapshot | null;
  dispositions: DispositionSnapshot[];
  notes: NoteSnapshot[];
  candidateApplications: CandidateApplicationSnapshot[];
  existingAssessments: ExistingAssessmentSnapshot[];
}
export interface ConfidenceReviewUpdateInput {
  manualAdjustment?: number;
  overrideReason?: string | null;
  reviewNotes?: string | null;
  assessmentStatus?: ConfidenceAssessmentStatus;
  reviewerName?: string | null;
}

export interface ConfidenceReviewPersistInput {
  manualAdjustment: number;
  overrideReason: string | null;
  reviewNotes: string | null;
  assessmentStatus: ConfidenceAssessmentStatus;
  reviewerName: string | null;
  reviewedAt: Date | null;
  finalScore: number;
  confidenceBand: ConfidenceBand;
}
