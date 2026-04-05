import type { Prisma, DispositionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ApplicationListFilters,
  ApplicationListItem,
  ApplicationListSort,
  FilterOptionsResponse,
  PaginatedApplicationResults,
} from "./types";
import { uniqueSortedStrings } from "../utils/normalize";

export function buildApplicationWhere(
  filters: ApplicationListFilters
): Prisma.ApplicationWhereInput {
  const and: Prisma.ApplicationWhereInput[] = [];

  if (filters.search) {
    and.push({
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { legacyId: { contains: filters.search, mode: "insensitive" } },
        { businessArea: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (filters.businessArea) {
    and.push({
      businessArea: {
        equals: filters.businessArea,
        mode: "insensitive",
      },
    });
  }

  if (filters.targetDisposition) {
    and.push({
      DispositionDecision: {
        some: {
          targetDisposition: filters.targetDisposition,
        },
      },
    });
  }

  if (filters.tsaConfidenceBand) {
    and.push({
      ConfidenceAssessment: {
        some: {
          horizonType: "TSA",
          confidenceBand: filters.tsaConfidenceBand,
        },
      },
    });
  }

  if (filters.longTermConfidenceBand) {
    and.push({
      ConfidenceAssessment: {
        some: {
          horizonType: "LONG_TERM",
          confidenceBand: filters.longTermConfidenceBand,
        },
      },
    });
  }

  if (filters.staleOnly) {
    and.push({
      ConfidenceAssessment: {
        some: {
          isStale: true,
        },
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function buildApplicationOrderBy(
  sort: ApplicationListSort
): Prisma.ApplicationOrderByWithRelationInput[] {
  switch (sort) {
    case "name_desc":
      return [{ name: "desc" }];

    case "businessArea_asc":
      return [{ businessArea: "asc" }, { name: "asc" }];

    case "updated_desc":
      return [{ updatedAt: "desc" }, { name: "asc" }];

    case "tsaConfidence_asc":
    case "tsaConfidence_desc":
    case "longTermConfidence_asc":
    case "longTermConfidence_desc":
      return [{ name: "asc" }];

    case "name_asc":
    default:
      return [{ name: "asc" }];
  }
}

function deriveDominantGap(assessment: {
  ConfidenceFactorScore: Array<{
    factorCode: string;
    weightedScore: Prisma.Decimal;
    explanation: string | null;
  }>;
} | undefined): string | null {
  if (!assessment || assessment.ConfidenceFactorScore.length === 0) {
    return null;
  }

  const weakestFactor = [...assessment.ConfidenceFactorScore].sort(
    (a, b) => a.weightedScore.toNumber() - b.weightedScore.toNumber()
  )[0];

  if (!weakestFactor) {
    return null;
  }

  return weakestFactor.explanation ?? weakestFactor.factorCode;
}

function mapApplicationRow(row: {
  id: string;
  legacyId: string | null;
  name: string;
  businessArea: string | null;
  description: string | null;
  updatedAt: Date;
  Ownership: Array<{ id: string }>;
  DispositionDecision: Array<{
    targetDisposition: DispositionType | null;
    updatedAt: Date;
  }>;
  ConfidenceAssessment: Array<{
    horizonType: "TSA" | "LONG_TERM";
    finalScore: number;
    confidenceBand: "LOW" | "MEDIUM" | "HIGH";
    isStale: boolean;
    ConfidenceFactorScore: Array< {
	    factorCode: string;
	    weightedScore: Prisma.Decimal;
	    explanation: string | null;
    }>;
  }>;
}): ApplicationListItem {
  const latestDisposition =
    row.DispositionDecision.length > 0
      ? row.DispositionDecision[0].targetDisposition
      : null;

  const tsa = row.ConfidenceAssessment.find((c) => c.horizonType === "TSA");
  const longTerm = row.ConfidenceAssessment.find(
    (c) => c.horizonType === "LONG_TERM"
  );
  const tsaDominantGap = deriveDominantGap(tsa);
  const longTermDominantGap = deriveDominantGap(longTerm);
return {
  id: row.id,
  legacyId: row.legacyId,
  name: row.name,
  businessArea: row.businessArea,
  description: row.description,
  updatedAt: row.updatedAt,
  ownershipCount: row.Ownership.length,
  latestTargetDisposition: latestDisposition,


  tsaConfidence: tsa
    ? {
        finalScore: tsa.finalScore,
        confidenceBand: tsa.confidenceBand,
        isStale: tsa.isStale,
        assessmentStatus: tsa.assessmentStatus,
        manualAdjustment: tsa.manualAdjustment,
      }
    : null,
  longTermConfidence: longTerm
    ? {
        finalScore: longTerm.finalScore,
        confidenceBand: longTerm.confidenceBand,
        isStale: longTerm.isStale,
        assessmentStatus: longTerm.assessmentStatus,
        manualAdjustment: longTerm.manualAdjustment,
      }
    : null,
  tsaDominantGap,
  longTermDominantGap,
}
};




function sortApplicationItems(
  items: ApplicationListItem[],
  sort: ApplicationListSort
): ApplicationListItem[] {
  const sorted = [...items];

  const tsaScore = (item: ApplicationListItem) =>
    item.tsaConfidence?.finalScore ?? -1;

  const ltScore = (item: ApplicationListItem) =>
    item.longTermConfidence?.finalScore ?? -1;

  switch (sort) {
    case "tsaConfidence_asc":
      return sorted.sort((a, b) => tsaScore(a) - tsaScore(b));

    case "tsaConfidence_desc":
      return sorted.sort((a, b) => tsaScore(b) - tsaScore(a));

    case "longTermConfidence_asc":
      return sorted.sort((a, b) => ltScore(a) - ltScore(b));

    case "longTermConfidence_desc":
      return sorted.sort((a, b) => ltScore(b) - ltScore(a));

    default:
      return sorted;
  }
}


export async function getApplications(
  filters: ApplicationListFilters
): Promise<PaginatedApplicationResults> {
  const where = buildApplicationWhere(filters);
  const orderBy = buildApplicationOrderBy(filters.sort);
  const skip = (filters.page - 1) * filters.pageSize;

  const [rows, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy,
      skip,
      take: filters.pageSize,
      select: {
        id: true,
        legacyId: true,
        name: true,
        businessArea: true,
        description: true,
        updatedAt: true,
        Ownership: {
          select: { id: true },
        },
        DispositionDecision: {
          orderBy: [{ updatedAt: "desc" }],
          take: 1,
          select: {
            targetDisposition: true,
            updatedAt: true,
          },
        },


        ConfidenceAssessment: {
          select: {
            horizonType: true,
            finalScore: true,
            confidenceBand: true,
            isStale: true,
            assessmentStatus: true,
            manualAdjustment: true,
	    ConfidenceFactorScore: {
		    select: {
			    factorCode: true,
			    weightedScore: true,
			    explanation: true,
		    },
	    },
          },
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const items = sortApplicationItems(rows.map(mapApplicationRow), filters.sort);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages,
  };
}


export async function getApplicationFilterOptions(): Promise<FilterOptionsResponse> {
  const [businessAreaRows, dispositionRows] = await Promise.all([
    prisma.application.findMany({
      select: { businessArea: true },
      distinct: ["businessArea"],
      orderBy: { businessArea: "asc" },
    }),
    prisma.dispositionDecision.findMany({
      where: {
        targetDisposition: {
          not: null,
        },
      },
      select: { targetDisposition: true },
      distinct: ["targetDisposition"],
      orderBy: { targetDisposition: "asc" },
    }),
  ]);

  return {
    businessAreas: uniqueSortedStrings(
      businessAreaRows.map((row) => row.businessArea)
    ),
    targetDispositions: dispositionRows
      .map((row) => row.targetDisposition)
      .filter((value): value is DispositionType => value !== null),
  };
}
