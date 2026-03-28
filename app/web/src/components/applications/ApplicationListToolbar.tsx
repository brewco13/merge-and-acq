import Link from "next/link";
import type { ApplicationListFilters, FilterOptionsResponse } from "@/lib/applications/types";

type Props = {
  filters: ApplicationListFilters;
  filterOptions: FilterOptionsResponse;
};

export default function ApplicationListToolbar({
  filters,
  filterOptions,
}: Props) {
  return (
    <form method="GET" style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input
        type="text"
        name="search"
        defaultValue={filters.search ?? ""}
        placeholder="Search..."
      />

      <select name="businessArea" defaultValue={filters.businessArea ?? ""}>
        <option value="">All Business Areas</option>
        {filterOptions.businessAreas.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select
        name="targetDisposition"
        defaultValue={filters.targetDisposition ?? ""}
      >
        <option value="">All Dispositions</option>
        {filterOptions.targetDispositions.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      <select name="sort" defaultValue={filters.sort}>
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="businessArea_asc">Business Area</option>
        <option value="updated_desc">Recently Updated</option>
      </select>

      <button type="submit">Apply</button>
      <Link href="/applications">Clear</Link>
    </form>
  );
}
