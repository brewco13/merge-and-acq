import {
  CONFIDENCE_BANDS,
  STALE_DAYS_THRESHOLD,
  clampConfidenceScore,
  clampManualAdjustment,
} from './confidence-rules';

import type {
  ConfidenceBand,
  ConfidenceHorizon,
  DecisionHorizonDb,
  OwnershipSnapshot,
} from './confidence-types';

export function normalizeManualAdjustment(
  value: number | null | undefined,
): number {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }

  return Math.round(clampManualAdjustment(value));
}

export function computeFinalConfidenceScore(
  calculatedScore: number,
  manualAdjustment: number | null | undefined,
): number {
  const normalizedAdjustment = normalizeManualAdjustment(manualAdjustment);
  return Math.round(clampConfidenceScore(calculatedScore + normalizedAdjustment));
}
export function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function roundScore(value: number): number {
  return Math.round(value);
}

/*
export function clampManualAdjustment(value: number): number {
  return Math.max(MANUAL_ADJUSTMENT_MIN, Math.min(MANUAL_ADJUSTMENT_MAX, value));
}
*/

export function deriveConfidenceBand(score: number): ConfidenceBand {
  const safeScore = clampScore(score);
  const match = CONFIDENCE_BANDS.find((entry) => safeScore >= entry.min && safeScore <= entry.max);
  return match?.band ?? 'LOW';
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function isAssessmentStale(reviewedAt: Date | null, now = new Date()): boolean {
  if (!reviewedAt) return true;
  return daysBetween(reviewedAt, now) > STALE_DAYS_THRESHOLD;
}

export function hasMeaningfulText(value?: string | null, minLength = 10): boolean {
  return Boolean(value && value.trim().length >= minLength);
}

export function buildExplanation(parts: string[]): string {
  return parts.filter(Boolean).join(' ');
}

export function computeWeightedScore(rawScore: number, weightPercent: number): number {
  return (clampScore(rawScore) * weightPercent) / 100;
}

export function mapDecisionHorizonToConfidenceHorizon(
  horizon: DecisionHorizonDb,
): ConfidenceHorizon {
  return horizon === 'TSA_EXPIRATION' ? 'TSA' : 'LONG_TERM';
}

export function selectAuthoritativeOwnership(
  ownershipRows: OwnershipSnapshot[],
): OwnershipSnapshot | null {
  if (!ownershipRows.length) return null;

  return [...ownershipRows].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  )[0];
}

export function includesAnyTerm(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

export function isNotStartedOrUnknown(status?: string | null): boolean {
  if (!status) return true;

  const normalized = status.trim().toUpperCase();
  return normalized === 'NOT_STARTED' || normalized === 'UNKNOWN';
}

export function isDispositionPlaceholder(value?: string | null): boolean {
  if (!value) return true;

  const normalized = value.trim().toUpperCase();
  return normalized === 'TBD' || normalized === 'UNKNOWN';
}
