import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageShell from "@/components/page-shell";

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <PageShell>
      <div
        style={{
          background: "white",
          border: "1px solid #dbe3ee",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Applications</h1>
            <p style={{ margin: "6px 0 0 0", color: "#667085" }}>
              Browse and manage the merger application inventory.
            </p>
          </div>

          <Link
            href="/applications/new"
            style={{
              textDecoration: "none",
              background: "#254f7a",
              color: "white",
              padding: "10px 14px",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            + New Application
          </Link>
        </div>

        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: 14,
            background: "white",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #dbe3ee",
                textAlign: "left",
                background: "#f8fafc",
              }}
            >
              <th style={{ padding: "10px 12px" }}>Name</th>
              <th style={{ padding: "10px 12px" }}>Legacy ID</th>
              <th style={{ padding: "10px 12px" }}>Business Area</th>
              <th style={{ padding: "10px 12px" }}>L1 Capability</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                style={{
                  borderBottom: "1px solid #eef2f6",
                }}
              >
                <td style={{ padding: "10px 12px" }}>
                  <Link href={`/applications/${app.id}`}>{app.name}</Link>
                </td>
                <td style={{ padding: "10px 12px" }}>{app.legacyId ?? ""}</td>
                <td style={{ padding: "10px 12px" }}>
                  {app.businessArea ?? ""}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {app.l1Capability ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}





import PageShell from "@/components/page-shell";

import Link from "next/link";
import { parseApplicationFilters } from "@/lib/applications/filters";
import {
  getApplications,
  getApplicationFilterOptions,
} from "@/lib/applications/queries";
import ApplicationListToolbar from "@/components/applications/ApplicationListToolbar";
import ActiveFilterChips from "@/components/applications/ActiveFilterChips";
import ApplicationTable from "@/components/applications/ApplicationTable";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildPageHref(
  searchParams: Record<string, string | string[] | undefined>,
  nextPage: number
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      params.set(key, value[0]);
    }
  }

  params.set("page", String(nextPage));

  return `?${params.toString()}`;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseApplicationFilters(resolvedSearchParams);

  const [results, filterOptions] = await Promise.all([
    getApplications(filters),
    getApplicationFilterOptions(),
  ]);

  return (

  <PageShell>
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

      <ApplicationListToolbar
        filters={filters}
        filterOptions={filterOptions}
      />

      <ActiveFilterChips filters={filters} />

      <p style={{ marginBottom: 10 }}>
        Showing {results.total} applications
      </p>

      <ApplicationTable results={results} />

      <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center" }}>
        {results.page > 1 ? (
          <Link href={buildPageHref(resolvedSearchParams, results.page - 1)}>
            Previous
          </Link>
        ) : (
          <span style={{ color: "#999" }}>Previous</span>
        )}

        <span>
          Page {results.page} of {results.totalPages}
        </span>

        {results.page < results.totalPages ? (
          <Link href={buildPageHref(resolvedSearchParams, results.page + 1)}>
            Next
          </Link>
        ) : (
          <span style={{ color: "#999" }}>Next</span>
        )}
      </div>
    </div>
  </PageShell>
  );
}
