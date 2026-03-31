import PageShell from "@/components/page-shell";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import { ConfidenceSection } from '@/components/applications/ConfidenceSection';

import { ConfidenceEngine } from "@/lib/confidence/confidence-engine";


type PageProps = {
  params: Promise<{ id: string }>;
    searchParams?: Promise<{ confidenceRecalculated?: string }>;
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




export default async function ApplicationDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const confidenceRecalculated = resolvedSearchParams?.confidenceRecalculated;


  const application = await prisma.application.findUnique({
  where: { id },
  include: {
    Ownership: {
      orderBy: { createdAt: "asc" },
      take: 1,
    },
    DispositionDecision: {
      orderBy: [{ decisionHorizon: "asc" }, { targetDate: "asc" }],
    },
    Note: {
      orderBy: { createdAt: "desc" },
      take: 5,
    },
  },
});

  if (!application) {
    notFound();
  }

  let confidence = null;

  try {
    const engine = new ConfidenceEngine(prisma);
    confidence = await engine.calculateOnly(id);
  } catch (error) {
    console.error("Failed to load confidence for application detail page:", error);
  }



const ownership = application.Ownership[0] ?? null;

const latestNote = application.Note[0] ?? null;

const tsaDecision =
  application.DispositionDecision.find(
    (d) => d.decisionHorizon === "TSA_EXPIRATION"
  ) ?? null;

const longTermDecision =
  application.DispositionDecision.find(
    (d) => d.decisionHorizon === "LONG_TERM"
  ) ?? null;



  return (


<PageShell>

    <div style={{ padding: 20, maxWidth: 1000 }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <Link href="/applications">← Back to applications</Link>
        <Link href={`/applications/${application.id}/ownership`}>Edit ownership</Link>
        <Link href={`/applications/${application.id}/disposition`}>Edit disposition</Link>
        <Link href={`/applications/${application.id}/notes`}>Edit notes</Link>
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


      <h2>Confidence</h2>

<form action={`/api/applications/${id}/confidence/recalculate`} method="POST">
  <button
    type="submit"
    style={{
      padding: "8px 12px",
      border: "1px solid #ccc",
      borderRadius: 6,
      cursor: "pointer",
      marginTop: 10,
    }}
  >
    Recalculate Confidence
  </button>
</form>

      {confidenceRecalculated === '1' ? (
        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 10,
            border: '1px solid #b7e4c7',
            backgroundColor: '#f0fff4',
            borderRadius: 6,
            color: '#1f5f3a',
          }}
        >
          Confidence recalculated successfully.
        </div>
      ) : null}

      {confidenceRecalculated === 'error' ? (
        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 10,
            border: '1px solid #f5c2c7',
            backgroundColor: '#fff5f5',
            borderRadius: 6,
            color: '#842029',
          }}
        >
          Confidence recalculation failed.
        </div>
      ) : null}

<ConfidenceSection confidence={confidence} />


      <h2>Notes</h2>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: 24,
        }}
      >
        <tbody>
          <DetailRow label="Latest Note" value={latestNote?.content} />
          <DetailRow label="Source" value={latestNote?.source} />
          <DetailRow label="Created At" value={formatDate(latestNote?.createdAt ?? null)} />
          <DetailRow label="Updated At" value={formatDate(latestNote?.updatedAt ?? null)} />
        </tbody>
      </table>

{application.Note && application.Note.length > 1 && (
  <>
    <h3>Recent Notes</h3>
    <ul>
      {application.Note.slice(1).map((note) => (
        <li key={note.id} style={{ marginBottom: 12 }}>
          <div><strong>{note.source ?? "—"}</strong></div>
          <div>{note.content}</div>
          <div style={{ color: "#666", fontSize: 12 }}>
            {formatDate(note.updatedAt)}
          </div>
        </li>
      ))}
    </ul>
  </>
)}

    </div>
</PageShell>
  );
}
