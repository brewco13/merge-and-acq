
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatDateOnly(value: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <tr>
      <td style={{ fontWeight: 600, padding: "8px 12px", width: 240 }}>
        {label}
      </td>
      <td style={{ padding: "8px 12px" }}>{value && value.trim() ? value : "—"}</td>
    </tr>
  );
}

function DecisionRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <tr>
      <td style={{ fontWeight: 600, padding: "8px 12px", width: 220 }}>
        {label}
      </td>
      <td style={{ padding: "8px 12px" }}>{value && value.trim() ? value : "—"}</td>
    </tr>
  );
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      ownerships: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      decisions: {
        orderBy: [{ decisionHorizon: "asc" }, { targetDate: "asc" }],
      },
    },
  });

  if (!application) {
    notFound();
  }

  const ownership = application.ownerships[0] ?? null;

  const tsaDecision =
    application.decisions.find((d) => d.decisionHorizon === "TSA_EXPIRATION") ?? null;

  const longTermDecision =
    application.decisions.find((d) => d.decisionHorizon === "LONG_TERM") ?? null;

  return (
    <div style={{ padding: 20, maxWidth: 1000 }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <Link href="/applications">← Back to applications</Link>
        <Link href={`/applications/${application.id}/ownership`}>Edit ownership</Link>
        <Link href={`/applications/${application.id}/disposition`}>Edit disposition</Link>
      </div>

      <h1 style={{ marginBottom: 4 }}>{application.name}</h1>
      <p style={{ marginTop: 0, color: "#666" }}>Application detail record</p>

      <h2>Application</h2>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: 24,
        }}
      >
        <tbody>
          <DetailRow label="Name" value={application.name} />
          <DetailRow label="Legacy ID" value={application.legacyId} />
          <DetailRow label="Business Area" value={application.businessArea} />
          <DetailRow label="L1 Capability" value={application.l1Capability} />
          <DetailRow label="L2 Capability" value={application.l2Capability} />
          <DetailRow label="L3 Capability" value={application.l3Capability} />
          <DetailRow label="Description" value={application.description} />
          <DetailRow label="Source Company" value={application.sourceCompany} />
          <DetailRow label="Source Environment" value={application.sourceEnvironment} />
          <DetailRow label="Current State" value={application.currentState} />
          <DetailRow label="Criticality" value={application.criticality} />
          <DetailRow label="Lifecycle Status" value={application.lifecycleStatus} />
          <DetailRow label="Created At" value={formatDate(application.createdAt)} />
          <DetailRow label="Updated At" value={formatDate(application.updatedAt)} />
        </tbody>
      </table>

      <h2>Ownership</h2>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: 24,
        }}
      >
        <tbody>
          <DetailRow label="Business Owner" value={ownership?.businessOwner} />
          <DetailRow label="Technical Owner" value={ownership?.technicalOwner} />
          <DetailRow label="Business Decision Owner" value={ownership?.businessDecisionOwner} />
          <DetailRow label="Technical Decision Owner" value={ownership?.technicalDecisionOwner} />
        </tbody>
      </table>

      <h2>TSA Disposition</h2>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: 24,
        }}
      >
        <tbody>
          <DecisionRow label="Disposition" value={tsaDecision?.targetDisposition ?? null} />
          <DecisionRow label="Status" value={tsaDecision?.status ?? null} />
          <DecisionRow label="Target Date" value={formatDateOnly(tsaDecision?.targetDate ?? null)} />
          <DecisionRow label="Target Platform" value={tsaDecision?.targetPlatform} />
          <DecisionRow label="Target Timeline" value={tsaDecision?.targetTimeline} />
          <DecisionRow label="Rationale" value={tsaDecision?.rationale} />
        </tbody>
      </table>

      <h2>Long-Term Disposition</h2>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <tbody>
          <DecisionRow
            label="Disposition"
            value={longTermDecision?.targetDisposition ?? null}
          />
          <DecisionRow label="Status" value={longTermDecision?.status ?? null} />
          <DecisionRow
            label="Target Date"
            value={formatDateOnly(longTermDecision?.targetDate ?? null)}
          />
          <DecisionRow label="Target Platform" value={longTermDecision?.targetPlatform} />
          <DecisionRow label="Target Timeline" value={longTermDecision?.targetTimeline} />
          <DecisionRow label="Rationale" value={longTermDecision?.rationale} />
        </tbody>
      </table>
    </div>
  );
}
