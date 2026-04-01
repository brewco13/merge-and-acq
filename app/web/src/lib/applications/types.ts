import type { DispositionType } from "@prisma/client";

export type ApplicationListSort =
  | "name_asc"
  | "name_desc"
  | "businessArea_asc"
  | "updated_desc"
  | "tsaConfidence_asc"
  | "tsaConfidence_desc"
  | "longTermConfidence_asc"
  | "longTermConfidence_desc";

export type ConfidenceBandFilter = "LOW" | "MEDIUM" | "HIGH";

 export type ApplicationListFilters = {
  search?: string;
  businessArea?: string;
  targetDisposition?: DispositionType;
  tsaConfidenceBand?: ConfidenceBandFilter;
  longTermConfidenceBand?: ConfidenceBandFilter;
  staleOnly?: boolean;
  sort: ApplicationListSort;
  page: number;
  pageSize: number;
};

export type FilterOptionsResponse = {
  businessAreas: string[];
  targetDispositions: DispositionType[];
};

export type ApplicationConfidenceSummary = {
  finalScore: number;
  confidenceBand: "LOW" | "MEDIUM" | "HIGH";
  isStale: boolean;
} | null;

export type ApplicationListItem = {
  id: string;
  legacyId: string | null;
  name: string;
  businessArea: string | null;
  description: string | null;
  updatedAt: Date;
  ownershipCount: number;
  latestTargetDisposition: DispositionType | null;
  tsaConfidence: ApplicationConfidenceSummary;
  longTermConfidence: ApplicationConfidenceSummary;
};

export type PaginatedApplicationResults = {
  items: ApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
