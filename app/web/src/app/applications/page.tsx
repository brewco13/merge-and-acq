import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const applications = await prisma.application.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { legacyId: { contains: query, mode: "insensitive" } },
            { businessArea: { contains: query, mode: "insensitive" } },
            { l1Capability: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      Ownership: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      DispositionDecision: {
        orderBy: [{ decisionHorizon: "asc" }, { targetDate: "asc" }],
      },
    },
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
        <div>
          <h1 style={{ marginBottom: 4 }}>Applications</h1>
          <p style={{ marginTop: 0, color: "#666" }}>
            Merger application inventory and disposition tracking
          </p>
        </div>

        <Link href="/applications/new">+ Create Application</Link>
      </div>

      <form method="GET" style={{ marginBottom: 20 }}>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search name, legacy ID, business area, capability..."
          style={{
            width: "100%",
            maxWidth: 480,
            padding: "8px 10px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
      </form>

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
            <th style={{ padding: "10px 8px" }}>Business Owner</th>
            <th style={{ padding: "10px 8px" }}>TSA Disposition</th>
            <th style={{ padding: "10px 8px" }}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const ownership = app.Ownership[0] ?? null;
            const tsaDecision =
              app.DispositionDecision.find(
                (d) => d.decisionHorizon === "TSA_EXPIRATION"
              ) ?? null;

            return (
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
                  {ownership?.businessOwner ?? "—"}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  {tsaDecision?.targetDisposition ?? "—"}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(app.updatedAt)}
                </td>
              </tr>
            );
          })}

          {applications.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "16px 8px", color: "#666" }}>
                No applications found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
