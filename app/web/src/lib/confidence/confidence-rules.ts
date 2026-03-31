import type { ConfidenceBand, ConfidenceFactorCode } from './confidence-types';

export const CONFIDENCE_MODEL_VERSION = 'v1.0';

export const MANUAL_ADJUSTMENT_MIN = -20;
export const MANUAL_ADJUSTMENT_MAX = 20;

export const STALE_DAYS_THRESHOLD = 90;

export const FACTOR_ORDER: ConfidenceFactorCode[] = [
  'DISPOSITION_DEFINITION',
  'EVIDENCE_QUALITY',
  'BUSINESS_ALIGNMENT',
  'TECHNICAL_ALIGNMENT',
  'EXECUTION_READINESS',
  'STABILITY_CONSISTENCY',
];

export const TSA_FACTOR_WEIGHTS: Record<ConfidenceFactorCode, number> = {
  DISPOSITION_DEFINITION: 20,
  EVIDENCE_QUALITY: 20,
  BUSINESS_ALIGNMENT: 20,
  TECHNICAL_ALIGNMENT: 20,
  EXECUTION_READINESS: 15,
  STABILITY_CONSISTENCY: 5,
};

export const LONG_TERM_FACTOR_WEIGHTS: Record<ConfidenceFactorCode, number> = {
  DISPOSITION_DEFINITION: 15,
  EVIDENCE_QUALITY: 20,
  BUSINESS_ALIGNMENT: 20,
  TECHNICAL_ALIGNMENT: 25,
  EXECUTION_READINESS: 10,
  STABILITY_CONSISTENCY: 10,
};

export const CONFIDENCE_BANDS: Array<{
  min: number;
  max: number;
  band: ConfidenceBand;
}> = [
  { min: 0, max: 39, band: 'LOW' },
  { min: 40, max: 69, band: 'MEDIUM' },
  { min: 70, max: 100, band: 'HIGH' },
];
