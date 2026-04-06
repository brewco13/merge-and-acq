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

import type { PaginatedApplicationResults } from "@/lib/applications/types";

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

const queueChipStyle = {
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  background: "#f7f7f7",
  cursor: "pointer",
  display: "inline-block",
};


function buildQueueCounts(results: PaginatedApplicationResults) {
//function buildQueueCounts(results: typeof results) {
  let needsReview = 0;
  let overridden = 0;
  let lowConfidence = 0;
  let stale = 0;

  for (const app of results.items) {
    const tsa = app.tsaConfidence;
    const lt = app.longTermConfidence;

    if (
      tsa?.assessmentStatus === "SYSTEM_CALCULATED" ||
      lt?.assessmentStatus === "SYSTEM_CALCULATED"
    ) {
      needsReview++;
    }

    if ((tsa?.manualAdjustment ?? 0) !== 0 || (lt?.manualAdjustment ?? 0) !== 0) {
      overridden++;
    }

    if (tsa?.confidenceBand === "LOW" || lt?.confidenceBand === "LOW") {
      lowConfidence++;
    }

    if (tsa?.isStale || lt?.isStale) {
      stale++;
    }
  }
  return { needsReview, overridden, lowConfidence, stale };
}


export default async function ApplicationsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseApplicationFilters(resolvedSearchParams);

  const [results, filterOptions] = await Promise.all([
    getApplications(filters),
    getApplicationFilterOptions(),
  ]);

   const queueCounts = buildQueueCounts(results);

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

<div
  style={{
    marginBottom: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  }}
>
     <Link href="/applications?needsReviewOnly=true">
       <span style={queueChipStyle}>
	 Needs Review: {queueCounts.needsReview}
	  </span>
     </Link>

     <Link href="/applications?overriddenOnly=true">
       <span style={queueChipStyle}>
	 Overridden: {queueCounts.overridden}
       </span>
     </Link>

     <Link href="/applications?lowConfidenceOnly=true">
       <span style={queueChipStyle}>
	 Low Confidence: {queueCounts.lowConfidence}
       </span>
     </Link>

     <Link href="/applications?staleOnly=true">
       <span style={queueChipStyle}>
	 Stale: {queueCounts.stale}
    </span>
     </Link>
   </div>


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
