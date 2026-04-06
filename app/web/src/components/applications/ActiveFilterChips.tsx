import Link from "next/link";
import type { ApplicationListFilters } from "@/lib/applications/types";

type Props = {
  filters: ApplicationListFilters;
};

export default function ActiveFilterChips({ filters }: Props) {
  const chips: string[] = [];

  if (filters.search) chips.push(`Search: ${filters.search}`);
  if (filters.businessArea) chips.push(`Business Area: ${filters.businessArea}`);
  if (filters.targetDisposition) chips.push(`Disposition: ${filters.targetDisposition}`);

  if (filters.needsReviewOnly) chips.push("Needs Review");
  if (filters.overriddenOnly) chips.push("Overridden");
  if (filters.lowConfidenceOnly) chips.push("Low Confidence");


  if (chips.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
      {chips.map((chip) => (
        <span
          key={chip}
          style={{
            border: "1px solid #ccc",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            background: "#f7f7f7",
          }}
        >
          {chip}
        </span>
      ))}
      <Link href="/applications">Clear all</Link>
    </div>
  );
}
