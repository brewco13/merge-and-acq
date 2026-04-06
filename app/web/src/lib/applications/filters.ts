import type { 	ApplicationListFilters, 
		ApplicationListSort,
		ConfidenceBandFilter, 
	    } from "./types";
import type { DispositionType } from "@prisma/client";




export function parseApplicationFilters(
  searchParams: Record<string, string | string[] | undefined>
): ApplicationListFilters {
  const rawSearch = getSingleValue(searchParams.search)?.trim();
  const rawBusinessArea = getSingleValue(searchParams.businessArea)?.trim();
  const rawTargetDisposition = getSingleValue(searchParams.targetDisposition)?.trim();
  const rawSort = getSingleValue(searchParams.sort);

  const sort: ApplicationListSort = ALLOWED_SORTS.includes(
    rawSort as ApplicationListSort
  )
    ? (rawSort as ApplicationListSort)
    : "name_asc";

  const targetDisposition = ALLOWED_TARGET_DISPOSITIONS.includes(
    rawTargetDisposition as DispositionType
  )
    ? (rawTargetDisposition as DispositionType)
    : undefined;

  const staleOnly =
    getSingleValue(searchParams.staleOnly) === "true";

  const needsReviewOnly =
    getSingleValue(searchParams.needsReviewOnly) === "true";

  const overriddenOnly =
    getSingleValue(searchParams.overriddenOnly) === "true";

  const lowConfidenceOnly =
    getSingleValue(searchParams.lowConfidenceOnly) === "true";

  const hasExplicitQueueFilter =
    searchParams.needsReviewOnly !== undefined ||
    searchParams.overriddenOnly !== undefined ||
    searchParams.lowConfidenceOnly !== undefined ||
    searchParams.staleOnly !== undefined;

  const effectiveNeedsReviewOnly =
    hasExplicitQueueFilter ? needsReviewOnly : true;

  return {
    search: rawSearch || undefined,
    businessArea: rawBusinessArea || undefined,
    targetDisposition,

    tsaConfidenceBand:
      typeof searchParams.tsaConfidenceBand === "string"
        ? (searchParams.tsaConfidenceBand as ConfidenceBandFilter)
        : undefined,

    longTermConfidenceBand:
      typeof searchParams.longTermConfidenceBand === "string"
        ? (searchParams.longTermConfidenceBand as ConfidenceBandFilter)
        : undefined,

    staleOnly,
    needsReviewOnly: effectiveNeedsReviewOnly,
    overriddenOnly,
    lowConfidenceOnly,

    sort,
    page: parsePositiveInt(getSingleValue(searchParams.page), 1),
    pageSize: parsePositiveInt(getSingleValue(searchParams.pageSize), 25, 100),
  };
}






const ALLOWED_SORTS: ApplicationListSort[] = [
  "name_asc",
  "name_desc",
  "businessArea_asc",
  "updated_desc",
  "tsaConfidence_asc",
  "tsaConfidence_desc",
  "longTermConfidence_asc",
  "longTermConfidence_desc",
];

const ALLOWED_TARGET_DISPOSITIONS: DispositionType[] = [
  "RETAIN",
  "RETIRE",
  "REPLACE",
  "REHOST",
  "REPLATFORM",
  "REPURCHASE",
  "CONSOLIDATE",
];





function getSingleValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max?: number
): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  if (max && parsed > max) {
    return max;
  }

  return parsed;
}

