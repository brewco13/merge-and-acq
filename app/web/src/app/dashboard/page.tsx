"use client";

import { useEffect, useState } from "react";
import PageShell from "@/components/page-shell";

type CountRow = {
  label: string;
  count: number;
};

type DashboardSummary = {
  totalApplications: number;
  withOwnership: number;
  withNotes: number;
  tsaDecisions: number;
  longTermDecisions: number;
  businessArea: CountRow[];
  tsaDisposition: CountRow[];
  longTermDisposition: CountRow[];
};

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #dbe3ee",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
      }}
    >
      <div style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#17324d" }}>
        {value}
      </div>
    </div>
  );
}

function CountTable({
  title,
  rows,
}: {
  title: string;
  rows: CountRow[];
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #dbe3ee",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>
        {title}
      </h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td style={{ padding: "8px 0" }}>{row.label}</td>
              <td style={{ textAlign: "right" }}>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary", { cache: "no-store" })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <PageShell>
      <h1>Dashboard</h1>

      {!data && <div>Loading...</div>}

      {data && (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <Card title="Total Applications" value={data.totalApplications} />
            <Card title="With Ownership" value={data.withOwnership} />
            <Card title="With Notes" value={data.withNotes} />
            <Card title="TSA Decisions" value={data.tsaDecisions} />
            <Card title="Long-Term Decisions" value={data.longTermDecisions} />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <CountTable title="Business Area" rows={data.businessArea} />
            <CountTable title="TSA Disposition" rows={data.tsaDisposition} />
            <CountTable title="Long Term" rows={data.longTermDisposition} />
          </div>
        </>
      )}
    </PageShell>
  );
}
