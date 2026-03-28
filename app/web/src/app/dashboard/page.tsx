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

function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #dbe3ee",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        minHeight: 110,
      }}
    >
      <div style={{ fontSize: 13, color: "#667085", marginBottom: 8 }}>
        {title}
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
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 20 }}>{title}</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr
            style={{
              textAlign: "left",
              borderBottom: "2px solid #e4e7ec",
            }}
          >
            <th style={{ padding: "8px 0" }}>Value</th>
            <th style={{ padding: "8px 0", textAlign: "right" }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              style={{
                borderBottom: "1px solid #f0f2f5",
              }}
            >
              <td style={{ padding: "10px 0" }}>{row.label}</td>
              <td style={{ padding: "10px 0", textAlign: "right" }}>
                {row.count}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} style={{ padding: "10px 0", color: "#667085" }}>
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard/summary", {
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to load dashboard");
        }

        const json = (await res.json()) as DashboardSummary;

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Dashboard</h1>
        <p style={{ margin: "8px 0 0 0", color: "#667085" }}>
          Summary view of merger application inventory, ownership, and disposition.
        </p>
      </div>

      {loading && (
        <div
          style={{
            background: "white",
            border: "1px solid #dbe3ee",
            borderRadius: 12,
            padding: 20,
          }}
        >
          Loading dashboard...
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#fff4f4",
            border: "1px solid #f0c7c7",
            color: "#8a1c1c",
            borderRadius: 12,
            padding: 20,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <Card title="Total Applications" value={data.totalApplications} />
            <Card title="With Ownership" value={data.withOwnership} />
            <Card title="With Notes" value={data.withNotes} />
            <Card title="TSA Decisions" value={data.tsaDecisions} />
            <Card title="Long-Term Decisions" value={data.longTermDecisions} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <CountTable
              title="Applications by Business Area"
              rows={data.businessArea}
            />
            <CountTable
              title="TSA Disposition Counts"
              rows={data.tsaDisposition}
            />
            <CountTable
              title="Long-Term Disposition Counts"
              rows={data.longTermDisposition}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
