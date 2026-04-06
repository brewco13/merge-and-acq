import Link from "next/link";
import type { 	ApplicationConfidenceSummary,
	      	PaginatedApplicationResults,
  	    } from "@/lib/applications/types";

type Props = {
  results: PaginatedApplicationResults;
};



function renderConfidence(confidence: any) {
  if (!confidence) return <span style={{ color: "#999" }}>—</span>;

  const {
    finalScore,
    confidenceBand,
    isStale,
    assessmentStatus,
    manualAdjustment,
  } = confidence;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Top row */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>{finalScore}</span>

        <span
          style={{
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 999,
            border: "1px solid #ddd",
          }}
        >
          {confidenceBand}
        </span>

        {isStale && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 999,
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
            }}
          >
            Stale
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <span
          style={{
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 999,
            border: "1px solid #ddd",
          }}
        >
          {formatStatus(assessmentStatus)}
        </span>

        {manualAdjustment !== 0 && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 999,
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
            }}
          >
            Adjusted {manualAdjustment > 0 ? "+" : ""}
            {manualAdjustment}
          </span>
        )}
      </div>
    </div>
  );
}

function formatStatus(status: string | null) {
  switch (status) {
    case "SYSTEM_CALCULATED":
      return "System";
    case "REVIEWED":
      return "Reviewed";
    case "APPROVED":
      return "Approved";
    case "OVERRIDDEN":
      return "Overridden";
    default:
      return "—";
  }
}

// get rid of formatConfidence!! BP
function formatConfidence(
  confidence:
    | {
        finalScore: number;
        confidenceBand: "LOW" | "MEDIUM" | "HIGH";
        isStale: boolean;
      }
    | null
) {
  if (!confidence) return "—";

  const stale = confidence.isStale ? " ⚠" : "";
  return `${confidence.finalScore} ${confidence.confidenceBand}${stale}`;
}

export default function ApplicationTable({ results }: Props) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 14,
      }}
    >
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th style={{ padding: "10px 8px" }}>Name</th>
          <th style={{ padding: "10px 8px" }}>Legacy ID</th>
          <th style={{ padding: "10px 8px" }}>Business Area</th>
          <th style={{ padding: "10px 8px" }}>Ownership</th>
          <th style={{ padding: "10px 8px" }}>Disposition</th>
          <th style={{ padding: "10px 8px" }}>TSA Confidence</th>
          <th style={{ padding: "10px 8px" }}>LT Confidence</th>
          <th style={{ padding: "10px 8px" }}>Top Gap</th>
          <th style={{ padding: "10px 8px" }}>Updated</th>
        </tr>
      </thead>

      <tbody>
        {results.items.map((app) => (
          <tr
            key={app.id}
            style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}
          >
            <td style={{ padding: "10px 8px" }}>
              <Link href={`/applications/${app.id}`}>{app.name}</Link>
            </td>
            <td style={{ padding: "10px 8px" }}>{app.legacyId ?? "—"}</td>
            <td style={{ padding: "10px 8px" }}>{app.businessArea ?? "—"}</td>
            <td style={{ padding: "10px 8px" }}>
              {app.ownershipCount > 0 ? "✓" : "—"}
            </td>
            <td style={{ padding: "10px 8px" }}>
              {app.latestTargetDisposition ?? "—"}
            </td>
            <td 
	      style={{ padding: "10px 8px" }}
	      title={app.tsaDominantGap ?? ""}
	    >
	      {renderConfidence(app.tsaConfidence)}
            </td>

            <td
	      style={{ padding: "10px 8px" }}
	      title={app.longTermDominantGap ?? ""}
	    >
	      {renderConfidence(app.longTermConfidence)}
            </td>

	    <td style={{ padding: "10px 8px", maxWidth: 260 }}>
	  	<div style={{ fontSize: 12, color: "#444" }}>
	        {app.tsaDominantGap ?? app.longTermDominantGap ?? "—"}
		  </div>
	    </td>

            <td style={{ padding: "10px 8px" }}>
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(app.updatedAt)}
            </td>
          </tr>
        ))}

        {results.items.length === 0 && (
          <tr>
            <td colSpan={9} style={{ padding: "16px 8px", color: "#666" }}>
              No applications match the current filters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
