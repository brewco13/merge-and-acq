
'use client';

import { useState } from 'react';

type ConfidenceFactor = {
  factorCode: string;
  rawScore: number;
  weightPercent: number;
  weightedScore: number;
  maxScore: number;
  explanation: string;
  helpingSignals?: string[];
  loweringSignals?: string[];
};

type HorizonConfidence = {
  horizonType: 'TSA' | 'LONG_TERM';
  calculatedScore: number;
  manualAdjustment: number;
  finalScore: number;
  confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
  assessmentStatus: 'SYSTEM_CALCULATED' | 'REVIEWED' | 'APPROVED' | 'OVERRIDDEN';
  scoringModelVersion: string;
  isStale: boolean;
  calculatedAt: string | Date;
  reviewedAt: string | Date | null;
  reviewerName: string | null;
  reviewNotes: string | null;
  overrideReason: string | null;
  factorScores: ConfidenceFactor[];
};

type ApplicationConfidenceResponse = {
  applicationId: string;
  tsa: HorizonConfidence;
  longTerm: HorizonConfidence;
};

function bandClasses(band: 'LOW' | 'MEDIUM' | 'HIGH') {
  switch (band) {
    case 'HIGH':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LOW':
    default:
      return 'bg-red-50 text-red-700 border-red-200';
  }
}

function formatLabel(horizon: 'TSA' | 'LONG_TERM') {
  return horizon === 'TSA' ? 'TSA' : 'Long-term';
}

function formatDate(value: string | Date | null) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function formatAssessmentStatus(
  status: 'SYSTEM_CALCULATED' | 'REVIEWED' | 'APPROVED' | 'OVERRIDDEN',
) {
  switch (status) {
    case 'SYSTEM_CALCULATED':
      return 'System calculated';
    case 'REVIEWED':
      return 'Reviewed';
    case 'APPROVED':
      return 'Approved';

    case 'OVERRIDDEN':
      return 'Overridden';
  }
}

function getAssessmentCardClasses(
  status: 'SYSTEM_CALCULATED' | 'REVIEWED' | 'APPROVED' | 'OVERRIDDEN',
) {
  switch (status) {
    case 'OVERRIDDEN':
      return 'border-amber-300 bg-amber-50';
    case 'APPROVED':
      return 'border-green-300 bg-green-50';
    case 'REVIEWED':
      return 'border-blue-300 bg-blue-50';
    case 'SYSTEM_CALCULATED':
    default:
      return 'border-gray-200 bg-white';
  }
}


function getAssessmentAccentBar(
  status: 'SYSTEM_CALCULATED' | 'REVIEWED' | 'APPROVED' | 'OVERRIDDEN',
) {
  switch (status) {
    case 'OVERRIDDEN':
      return 'bg-amber-400';
    case 'APPROVED':
      return 'bg-green-400';
    case 'REVIEWED':
      return 'bg-blue-400';
    default:
      return null;
  }
}



function summarizeSignals(horizon: HorizonConfidence) {
  const helping = uniqueStrings(
    horizon.factorScores.flatMap((factor) => factor.helpingSignals ?? []),
  ).slice(0, 5);

  const lowering = uniqueStrings(
    horizon.factorScores.flatMap((factor) => factor.loweringSignals ?? []),
  ).slice(0, 5);

  return { helping, lowering };
}

function FactorBreakdown({ factors }: { factors: ConfidenceFactor[] }) {
  return (
    <div className="space-y-3">
      {factors.map((factor) => (
        <div key={factor.factorCode} className="rounded-lg border p-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="text-sm font-medium">
              {factor.factorCode.replaceAll('_', ' ')}
            </div>
            <div className="text-sm text-gray-600">{factor.rawScore}/100</div>
          </div>

          <div className="mb-2 h-2 w-full rounded bg-gray-100">
            <div
              className="h-2 rounded bg-gray-700"
              style={{ width: `${Math.max(0, Math.min(100, factor.rawScore))}%` }}
            />
          </div>

          <div className="text-xs text-gray-600">
            Weight: {factor.weightPercent}% · Weighted score: {factor.weightedScore}
          </div>

          {factor.explanation ? (
            <div className="mt-2 text-sm text-gray-700">{factor.explanation}</div>
          ) : null}

          {factor.helpingSignals?.length ? (
            <div className="mt-2">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Helping confidence
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                {factor.helpingSignals.map((item, idx) => (
                  <li key={`${factor.factorCode}-help-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {factor.loweringSignals?.length ? (
            <div className="mt-2">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Lowering confidence
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                {factor.loweringSignals.map((item, idx) => (
                  <li key={`${factor.factorCode}-lower-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}




function HorizonCard({
  horizon,
  applicationId,
}: {
  horizon: HorizonConfidence;
  applicationId: string;
}) {
  const [manualAdjustment, setManualAdjustment] = useState(horizon.manualAdjustment ?? 0);
  const [overrideReason, setOverrideReason] = useState(horizon.overrideReason ?? '');
  const [reviewNotes, setReviewNotes] = useState(horizon.reviewNotes ?? '');
  const [assessmentStatus, setAssessmentStatus] = useState(horizon.assessmentStatus);
  const [reviewerName, setReviewerName] = useState(horizon.reviewerName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewFinal = Math.max(
    0,
    Math.min(100, horizon.calculatedScore + manualAdjustment),
  );

  const summary = summarizeSignals(horizon);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(
        `/api/applications/${applicationId}/confidence/${horizon.horizonType}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualAdjustment,
            overrideReason: overrideReason.trim() || null,
            reviewNotes: reviewNotes.trim() || null,
            assessmentStatus,
            reviewerName: reviewerName.trim() || null,
          }),
        },
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to save');
      }

      window.location.reload();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${getAssessmentCardClasses(
//        horizon.assessmentStatus,
        assessmentStatus,
      )}`}
    >
      {getAssessmentAccentBar(assessmentStatus) && (
        <div
          className={`h-1 w-full ${getAssessmentAccentBar(horizon.assessmentStatus)}`}
        />
      )}

      <div className="p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">
              {formatLabel(horizon.horizonType)}
            </div>

            <div className="mt-1 text-xs text-gray-500">Final confidence</div>
            <div className="text-3xl font-semibold text-gray-900">
              {horizon.finalScore}
            </div>

            {horizon.manualAdjustment !== 0 ? (
              <div className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                Adjusted {horizon.manualAdjustment > 0 ? '+' : ''}
                {horizon.manualAdjustment}
              </div>
            ) : null}
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-sm font-medium ${bandClasses(
              horizon.confidenceBand,
            )}`}
          >
            {horizon.confidenceBand}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-white/70 p-3">
            <div className="text-gray-500">Calculated</div>
            <div className="font-medium text-gray-900">{horizon.calculatedScore}</div>
          </div>

          <div className="rounded-lg bg-white/70 p-3">
            <div className="text-gray-500">Manual adjustment</div>
            <div className="font-medium text-gray-900">
              {horizon.manualAdjustment > 0 ? '+' : ''}
              {horizon.manualAdjustment}
            </div>
          </div>

          <div className="rounded-lg bg-white/70 p-3">
            <div className="text-gray-500">Status</div>
            <div className="font-medium text-gray-900">
              {formatAssessmentStatus(horizon.assessmentStatus)}
            </div>
          </div>

          <div className="rounded-lg bg-white/70 p-3">
            <div className="text-gray-500">Stale</div>
            <div
              className={`font-medium ${
                horizon.isStale ? 'text-amber-700' : 'text-gray-900'
              }`}
            >
              {horizon.isStale ? 'Yes (not reviewed)' : 'No'}
            </div>
          </div>

          <div className="rounded-lg bg-white/70 p-3">
            <div className="text-gray-500">Calculated at</div>
            <div className="font-medium text-gray-900">
              {formatDate(horizon.calculatedAt)}
            </div>
          </div>

          <div className="rounded-lg bg-white/70 p-3">
            <div className="text-gray-500">Reviewed at</div>
            <div className="font-medium text-gray-900">
              {formatDate(horizon.reviewedAt)}
            </div>
          </div>
        </div>

        {(horizon.reviewNotes || horizon.overrideReason || horizon.reviewerName) && (
          <div className="mb-4 rounded-lg border bg-gray-50 p-3 text-sm">
            {horizon.reviewerName ? (
              <div className="mb-1">
                <span className="text-gray-500">Reviewer:</span>{' '}
                <span className="font-medium text-gray-900">{horizon.reviewerName}</span>
              </div>
            ) : null}

            {horizon.reviewNotes ? (
              <div className="mb-1">
                <span className="text-gray-500">Review notes:</span>{' '}
                <span className="text-gray-900">{horizon.reviewNotes}</span>
              </div>
            ) : null}

            {horizon.overrideReason ? (
              <div>
                <span className="text-gray-500">Override reason:</span>{' '}
                <span className="text-gray-900">{horizon.overrideReason}</span>
              </div>
            ) : null}
          </div>
        )}

        {(summary.helping.length > 0 || summary.lowering.length > 0) && (
          <div className="mb-4 rounded-lg bg-white/70 p-3">
            <div className="mb-2 text-sm font-semibold text-gray-900">
              What’s driving this score
            </div>

            {summary.helping.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Helping confidence
                </div>
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                  {summary.helping.map((item, idx) => (
                    <li key={`summary-help-${horizon.horizonType}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.lowering.length > 0 && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Lowering confidence
                </div>
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                  {summary.lowering.map((item, idx) => (
                    <li key={`summary-lower-${horizon.horizonType}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <FactorBreakdown factors={horizon.factorScores} />

        <div className="mt-4 border-t pt-4">
          <h4 className="mb-2 text-sm font-semibold">Manual Review</h4>

          <div className="mb-2 text-sm">
            <div>Calculated: {horizon.calculatedScore}</div>
            <div>Preview Final: {previewFinal}</div>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <label>Adjustment</label>
            <input
              type="number"
              min={-15}
              max={15}
              step={1}
              value={manualAdjustment}
              onChange={(e) => setManualAdjustment(Number(e.target.value))}
              className="w-20 border px-2 py-1"
            />
          </div>

          <input
            type="text"
            placeholder="Override reason"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            className="mb-2 w-full border px-2 py-1"
          />

          <textarea
            placeholder="Review notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="mb-2 w-full border px-2 py-1"
          />

          <select
            value={assessmentStatus}
            onChange={(e) =>
              setAssessmentStatus(
                e.target.value as
                  | 'SYSTEM_CALCULATED'
                  | 'REVIEWED'
                  | 'APPROVED'
                  | 'OVERRIDDEN',
              )
            }
            className="mb-2 border px-2 py-1"
          >
            <option value="SYSTEM_CALCULATED">System</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="APPROVED">Approved</option>
            <option value="OVERRIDDEN">Overridden</option>
          </select>

          <input
            type="text"
            placeholder="Reviewer"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            className="mb-2 w-full border px-2 py-1"
          />

          {saveError ? <div className="mb-2 text-sm text-red-600">{saveError}</div> : null}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </div>
    </div>
  );
}


export function ConfidenceSection({
  confidence,
}: {
  confidence: ApplicationConfidenceResponse | null;
}) {
  if (!confidence) {
    return (
      <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Confidence</h2>
        <div className="text-sm text-gray-600">Confidence data is not available.</div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Confidence</h2>
          <p className="text-sm text-gray-600">
            Decision confidence for TSA and Long-term disposition horizons.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          Model version: {confidence.tsa.scoringModelVersion}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <HorizonCard
          horizon={confidence.tsa}
          applicationId={confidence.applicationId}
        />
        <HorizonCard
          horizon={confidence.longTerm}
          applicationId={confidence.applicationId}
        />
      </div>
    </section>
  );
}

