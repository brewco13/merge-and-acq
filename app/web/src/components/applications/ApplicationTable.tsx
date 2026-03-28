import Link from "next/link";
import type { PaginatedApplicationResults } from "@/lib/applications/types";

type Props = {
  results: PaginatedApplicationResults;
};

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
            <td colSpan={6} style={{ padding: "16px 8px", color: "#666" }}>
              No applications match the current filters.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
