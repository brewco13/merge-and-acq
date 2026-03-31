import {
  LONG_TERM_FACTOR_WEIGHTS,
  TSA_FACTOR_WEIGHTS,
} from './confidence-rules';
import {
  buildExplanation,
  clampScore,
  computeWeightedScore,
  hasMeaningfulText,
  includesAnyTerm,
  isDispositionPlaceholder,
  isNotStartedOrUnknown,
  mapDecisionHorizonToConfidenceHorizon,
} from './confidence-utils';
import type {
  ConfidenceContext,
  ConfidenceFactorCode,
  ConfidenceFactorResult,
  ConfidenceHorizon,
  ReviewStatus,
} from './confidence-types';

function getWeight(horizon: ConfidenceHorizon, factorCode: ConfidenceFactorCode): number {
  return horizon === 'TSA'
    ? TSA_FACTOR_WEIGHTS[factorCode]
    : LONG_TERM_FACTOR_WEIGHTS[factorCode];
}

function getDispositionForHorizon(context: ConfidenceContext, horizon: ConfidenceHorizon) {
  return [...context.dispositions]
    .filter((item) => mapDecisionHorizonToConfidenceHorizon(item.decisionHorizon) === horizon)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null;
}

function getCandidateAppsForDisposition(context: ConfidenceContext, dispositionId: string) {
  return context.candidateApplications.filter((item) => item.decisionId === dispositionId);
}

function isReviewed(status?: ReviewStatus | null): boolean {
  return status === 'REVIEWED' || status === 'SIGNED_OFF';
}

function isSignedOff(status?: ReviewStatus | null): boolean {
  return status === 'SIGNED_OFF';
}

export function scoreDispositionDefinition(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'DISPOSITION_DEFINITION';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (hasMeaningfulText(disposition?.targetDisposition)) {
    rawScore += 35;
    helpingSignals.push('Disposition selected.');
  } else {
    loweringSignals.push('Disposition not selected.');
  }

  if (hasMeaningfulText(disposition?.rationale)) {
    rawScore += 25;
    helpingSignals.push('Rationale documented.');
  } else {
    loweringSignals.push('Rationale missing.');
  }

  if (disposition?.targetDate) {
    rawScore += horizon === 'TSA' ? 15 : 10;
    helpingSignals.push('Target date documented.');
  } else {
    loweringSignals.push('Target date missing.');
  }

  if (hasMeaningfulText(disposition?.targetPlatform)) {
    rawScore += horizon === 'TSA' ? 15 : 20;
    helpingSignals.push('Target platform documented.');
  } else if (horizon === 'LONG_TERM') {
    loweringSignals.push('Target platform missing.');
  }

  if (disposition?.targetDisposition && !isDispositionPlaceholder(disposition.targetDisposition)) {
    rawScore += 10;
    helpingSignals.push('Disposition is not TBD/Unknown.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreEvidenceQuality(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'EVIDENCE_QUALITY';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  const notes = context.notes;

  const initialAnalysisNote = notes.find((note) =>
    includesAnyTerm(note.content, ['initial analysis', 'phase i', 'initial assessment']),
  );

  if (initialAnalysisNote) {
    rawScore += 20;
    helpingSignals.push('Initial analysis note exists.');
  } else {
    loweringSignals.push('Initial analysis note missing.');
  }

  const meaningfulNote = notes.find((note) => hasMeaningfulText(note.content, 40));
  if (meaningfulNote) {
    rawScore += 20;
    helpingSignals.push('Meaningful note exists.');
  } else {
    loweringSignals.push('Meaningful note missing.');
  }

  const candidateApps = disposition ? getCandidateAppsForDisposition(context, disposition.id) : [];
  if (candidateApps.length > 0) {
    rawScore += 20;
    helpingSignals.push('Candidate applications documented.');
  } else {
    loweringSignals.push('Candidate applications not documented.');
  }

  const dependencyNote = notes.find((note) =>
    includesAnyTerm(note.content, ['dependency', 'dependencies', 'assumption', 'blocker']),
  );
  if (dependencyNote) {
    rawScore += 20;
    helpingSignals.push('Dependencies or assumptions documented.');
  } else {
    loweringSignals.push('Dependencies or assumptions not documented.');
  }

  const latestReviewDate = [...context.dispositions]
    .map((item) => item.reviewedAt ?? item.decisionDate)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (latestReviewDate) {
    rawScore += 20;
    helpingSignals.push('Review date exists.');
  } else {
    loweringSignals.push('Review date missing.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreBusinessAlignment(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'BUSINESS_ALIGNMENT';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (hasMeaningfulText(context.ownership?.businessOwner)) {
    rawScore += 25;
    helpingSignals.push('Business owner assigned.');
  } else {
    loweringSignals.push('Business owner missing.');
  }

  if (hasMeaningfulText(context.ownership?.businessDecisionOwner)) {
    rawScore += 25;
    helpingSignals.push('Business decision owner assigned.');
  } else {
    loweringSignals.push('Business decision owner missing.');
  }

  if (isReviewed(disposition?.businessReviewStatus)) {
    rawScore += 25;
    helpingSignals.push('Business review completed.');
  } else {
    loweringSignals.push('Business review incomplete.');
  }

  if (isSignedOff(disposition?.businessSignoffStatus)) {
    rawScore += 25;
    helpingSignals.push('Business sign-off recorded.');
  } else {
    loweringSignals.push('Business sign-off missing.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreTechnicalAlignment(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'TECHNICAL_ALIGNMENT';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (hasMeaningfulText(context.ownership?.technicalOwner)) {
    rawScore += 25;
    helpingSignals.push('Technical owner assigned.');
  } else {
    loweringSignals.push('Technical owner missing.');
  }

  if (hasMeaningfulText(context.ownership?.technicalDecisionOwner)) {
    rawScore += 25;
    helpingSignals.push('Technical decision owner assigned.');
  } else {
    loweringSignals.push('Technical decision owner missing.');
  }

  if (isReviewed(disposition?.technicalReviewStatus)) {
    rawScore += 25;
    helpingSignals.push('Technical review completed.');
  } else {
    loweringSignals.push('Technical review incomplete.');
  }

  if (isSignedOff(disposition?.technicalSignoffStatus)) {
    rawScore += 25;
    helpingSignals.push('Technical sign-off recorded.');
  } else {
    loweringSignals.push('Technical sign-off missing.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreExecutionReadiness(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'EXECUTION_READINESS';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (disposition?.targetDate) {
    rawScore += horizon === 'TSA' ? 30 : 20;
    helpingSignals.push('Target date exists.');
  } else {
    loweringSignals.push('Target date missing.');
  }

  if (!isNotStartedOrUnknown(disposition?.status)) {
    rawScore += 20;
    helpingSignals.push('Status reflects progression.');
  } else {
    loweringSignals.push('Status does not reflect progression.');
  }

  if (horizon === 'TSA' && hasMeaningfulText(disposition?.targetDisposition)) {
    rawScore += 20;
    helpingSignals.push('TSA disposition is actionable.');
  }

  const blockerNote = context.notes.find((note) =>
    includesAnyTerm(note.content, ['blocker', 'issue', 'risk', 'dependency']),
  );
  if (blockerNote) {
    rawScore += 15;
    helpingSignals.push('Blockers or issues documented.');
  } else {
    loweringSignals.push('Blockers or issues not documented.');
  }

  if (hasMeaningfulText(disposition?.targetPlatform)) {
    rawScore += horizon === 'TSA' ? 15 : 30;
    helpingSignals.push('Target platform exists.');
  } else if (horizon === 'LONG_TERM') {
    loweringSignals.push('Long-term target platform missing.');
  }

  if (horizon === 'LONG_TERM') {
    const transitionEvidence = context.notes.find((note) =>
      includesAnyTerm(note.content, ['transition', 'destination', 'migration', 'move to']),
    );

    if (transitionEvidence || hasMeaningfulText(disposition?.targetTimeline)) {
      rawScore += 15;
      helpingSignals.push('Transition path or destination is defined.');
    } else {
      loweringSignals.push('Transition path or destination is not defined.');
    }
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}

export function scoreStabilityConsistency(
  context: ConfidenceContext,
  horizon: ConfidenceHorizon,
): ConfidenceFactorResult {
  const factorCode: ConfidenceFactorCode = 'STABILITY_CONSISTENCY';
  const disposition = getDispositionForHorizon(context, horizon);
  const weightPercent = getWeight(horizon, factorCode);

  let rawScore = 0;
  const helpingSignals: string[] = [];
  const loweringSignals: string[] = [];

  if (disposition?.targetDisposition) {
    rawScore += 30;
    helpingSignals.push('Disposition is present.');
  } else {
    loweringSignals.push('Disposition missing, reducing consistency.');
  }

  const contradictionNote = context.notes.find((note) =>
    includesAnyTerm(note.content, ['contradict', 'conflict', 'inconsistent']),
  );

  if (!contradictionNote) {
    rawScore += 20;
    helpingSignals.push('No contradiction note detected.');
  } else {
    loweringSignals.push('Potential contradiction noted.');
  }

  rawScore += 20;
  helpingSignals.push('Churn scoring deferred in v1; neutral placeholder applied.');

  if (
    disposition?.targetDisposition &&
    (hasMeaningfulText(disposition?.rationale) ||
      hasMeaningfulText(disposition?.targetPlatform) ||
      Boolean(disposition?.targetDate))
  ) {
    rawScore += 30;
    helpingSignals.push('Supporting fields align with the disposition.');
  } else {
    loweringSignals.push('Supporting fields for the disposition appear incomplete.');
  }

  rawScore = clampScore(rawScore);

  return {
    factorCode,
    rawScore,
    weightPercent,
    weightedScore: computeWeightedScore(rawScore, weightPercent),
    maxScore: 100,
    explanation: buildExplanation([...helpingSignals, ...loweringSignals]),
    helpingSignals,
    loweringSignals,
  };
}
