import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    businessArea?: string;
    disposition?: string;
  }>;
};

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const { q, businessArea, disposition } = await searchParams;
  const query = q?.trim() ?? "";
  
  const where: any = {};


if (query) {
  where.OR = [
    { name: { contains: query, mode: "insensitive" } },
    { legacyId: { contains: query, mode: "insensitive" } },
    { businessArea: { contains: query, mode: "insensitive" } },
  ];
}

if (businessArea) {
  where.businessArea = businessArea;
}

const applications = await prisma.application.findMany({
    where,
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


let filteredApps = applications;

if (disposition) {
  filteredApps = applications.filter((app) =>
    app.DispositionDecision.some(
      (d) => d.targetDisposition === disposition
    )
  );
}


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



      <form method="GET" style={{ marginBottom: 20, display: "flex", gap: 10 }}>
  <input
    type="text"
    name="q"
    defaultValue={query}
    placeholder="Search..."
  />

  <select name="businessArea" defaultValue={businessArea ?? ""}>
    <option value="">All Business Areas</option>
    <option value="Finance">Finance</option>
    <option value="HR">HR</option>
    <option value="Supply Chain">Supply Chain</option>
  </select>

  <select name="disposition" defaultValue={disposition ?? ""}>
    <option value="">All Dispositions</option>
    <option value="RETAIN">Retain</option>
    <option value="RETIRE">Retire</option>
    <option value="MIGRATE">Migrate</option>
  </select>

  <button type="submit">Apply</button>
</form>

<p style={{ marginBottom: 10 }}>
  Showing {filteredApps.length} applications
</p>

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


          {filteredApps.map((app) => {
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

	  {filteredApps.length === 0 && (
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
