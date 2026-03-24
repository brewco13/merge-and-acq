export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div style={{ padding: 20, maxWidth: 1200 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Applications</h1>
        <Link href="/applications/new">+ New Application</Link>
      </div>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: 14,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #ccc",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "8px 12px" }}>Name</th>
            <th style={{ padding: "8px 12px" }}>Legacy ID</th>
            <th style={{ padding: "8px 12px" }}>Business Area</th>
            <th style={{ padding: "8px 12px" }}>L1 Capability</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              style={{
                borderBottom: "1px solid #eee",
              }}
            >
              <td style={{ padding: "8px 12px" }}>
                <Link href={`/applications/${app.id}`}>{app.name}</Link>
              </td>
              <td style={{ padding: "8px 12px" }}>{app.legacyId ?? ""}</td>
              <td style={{ padding: "8px 12px" }}>{app.businessArea ?? ""}</td>
              <td style={{ padding: "8px 12px" }}>{app.l1Capability ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
