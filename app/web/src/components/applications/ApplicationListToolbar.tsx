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

      <select name="tsaConfidenceBand" defaultValue={filters.tsaConfidenceBand ?? ""}>
        <option value="">All TSA Confidence</option>
        <option value="LOW">TSA Low</option>
        <option value="MEDIUM">TSA Medium</option>
        <option value="HIGH">TSA High</option>
      </select>

      <select
        name="longTermConfidenceBand"
        defaultValue={filters.longTermConfidenceBand ?? ""}
      >
        <option value="">All LT Confidence</option>
        <option value="LOW">LT Low</option>
        <option value="MEDIUM">LT Medium</option>
        <option value="HIGH">LT High</option>
      </select>

      <select name="sort" defaultValue={filters.sort}>
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="businessArea_asc">Business Area</option>
        <option value="updated_desc">Recently Updated</option>
        <option value="tsaConfidence_asc">Lowest TSA Confidence</option>
        <option value="tsaConfidence_desc">Highest TSA Confidence</option>
        <option value="longTermConfidence_asc">Lowest LT Confidence</option>
        <option value="longTermConfidence_desc">Highest LT Confidence</option>
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="checkbox"
          name="staleOnly"
          value="true"
          defaultChecked={filters.staleOnly ?? false}
        />
        Stale only
      </label>



<label style={{ display: "flex", alignItems: "center", gap: 6 }}>
  <input
    type="checkbox"
    name="needsReviewOnly"
    value="true"
    defaultChecked={filters.needsReviewOnly ?? false}
  />
  Needs Review
</label>

<label style={{ display: "flex", alignItems: "center", gap: 6 }}>
  <input
    type="checkbox"
    name="overriddenOnly"
    value="true"
    defaultChecked={filters.overriddenOnly ?? false}
  />
  Overridden
</label>

<label style={{ display: "flex", alignItems: "center", gap: 6 }}>
  <input
    type="checkbox"
    name="lowConfidenceOnly"
    value="true"
    defaultChecked={filters.lowConfidenceOnly ?? false}
  />
  Low Confidence
</label>





      <button type="submit">Apply</button>
      <Link href="/applications">Clear</Link>
    </form>
  );
}
