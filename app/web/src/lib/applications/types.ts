import type { DispositionType } from "@prisma/client";

export type ApplicationListSort =
  | "name_asc"
  | "name_desc"
  | "businessArea_asc"
  | "updated_desc";

export type ApplicationListFilters = {
  search?: string;
  businessArea?: string;
  targetDisposition?: DispositionType;
  sort: ApplicationListSort;
  page: number;
  pageSize: number;
};

export type FilterOptionsResponse = {
  businessAreas: string[];
  targetDispositions: DispositionType[];
};

export type ApplicationListItem = {
  id: string;
  legacyId: string | null;
  name: string;
  businessArea: string | null;
  description: string | null;
  updatedAt: Date;
  ownershipCount: number;
  latestTargetDisposition: DispositionType | null;
};

export type PaginatedApplicationResults = {
  items: ApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
