import PageShell from "@/components/page-shell";
import { prisma } from "@/lib/prisma";

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
  rows: { label: string; count: number }[];
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

export default async function DashboardPage() {
  const [
    totalApplications,
    withOwnership,
    withNotes,
    tsaDecisions,
    longTermDecisions,
    businessAreaGroups,
    tsaDispositionGroups,
    longTermDispositionGroups,
  ] = await Promise.all([
    prisma.application.count(),

    prisma.application.count({
      where: {
        Ownership: {
          some: {},
        },
      },
    }),

    prisma.application.count({
      where: {
        Note: {
          some: {},
        },
      },
    }),

    prisma.dispositionDecision.count({
      where: {
        decisionHorizon: "TSA_EXPIRATION",
      },
    }),

    prisma.dispositionDecision.count({
      where: {
        decisionHorizon: "LONG_TERM",
      },
    }),

    prisma.application.groupBy({
      by: ["businessArea"],
      _count: {
        businessArea: true,
      },
      orderBy: {
        _count: {
          businessArea: "desc",
        },
      },
    }),

    prisma.dispositionDecision.groupBy({
      by: ["targetDisposition"],
      where: {
        decisionHorizon: "TSA_EXPIRATION",
      },
      _count: {
        targetDisposition: true,
      },
      orderBy: {
        _count: {
          targetDisposition: "desc",
        },
      },
    }),

    prisma.dispositionDecision.groupBy({
      by: ["targetDisposition"],
      where: {
        decisionHorizon: "LONG_TERM",
      },
      _count: {
        targetDisposition: true,
      },
      orderBy: {
        _count: {
          targetDisposition: "desc",
        },
      },
    }),
  ]);

  const businessAreaRows = businessAreaGroups.map((row) => ({
    label: row.businessArea ?? "Unspecified",
    count: row._count.businessArea,
  }));

  const tsaDispositionRows = tsaDispositionGroups.map((row) => ({
    label: row.targetDisposition ?? "Unspecified",
    count: row._count.targetDisposition,
  }));

  const longTermDispositionRows = longTermDispositionGroups.map((row) => ({
    label: row.targetDisposition ?? "Unspecified",
    count: row._count.targetDisposition,
  }));

  return (
    <PageShell>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 30 }}>Dashboard</h1>
        <p style={{ margin: "8px 0 0 0", color: "#667085" }}>
          Summary view of merger application inventory, ownership, and disposition.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <Card title="Total Applications" value={totalApplications} />
        <Card title="With Ownership" value={withOwnership} />
        <Card title="With Notes" value={withNotes} />
        <Card title="TSA Decisions" value={tsaDecisions} />
        <Card title="Long-Term Decisions" value={longTermDecisions} />
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
          rows={businessAreaRows}
        />

        <CountTable
          title="TSA Disposition Counts"
          rows={tsaDispositionRows}
        />

        <CountTable
          title="Long-Term Disposition Counts"
          rows={longTermDispositionRows}
        />
      </div>
    </PageShell>
  );
}

