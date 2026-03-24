export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DispositionForm from "./disposition-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApplicationDispositionPage({ params }: PageProps) {
  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      DispositionDecision: true,
    },
  });

  if (!application) {
    notFound();
  }

  const tsaDecision =
    application.DispositionDecision.find((d) => d.decisionHorizon === "TSA_EXPIRATION") ?? null;

  const longTermDecision =
    application.DispositionDecision.find((d) => d.decisionHorizon === "LONG_TERM") ?? null;

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <Link href={`/applications/${application.id}`}>← Back to application</Link>
        <Link href="/applications">Applications</Link>
      </div>

      <h1 style={{ marginBottom: 4 }}>Edit Disposition</h1>
      <p style={{ marginTop: 0, color: "#666" }}>{application.name}</p>

      <DispositionForm
        applicationId={application.id}
        initialValues={{
          tsa: {
            targetDisposition: tsaDecision?.targetDisposition ?? "",
            status: tsaDecision?.status ?? "",
            targetDate: tsaDecision?.targetDate
              ? tsaDecision.targetDate.toISOString().slice(0, 10)
              : "",
            targetPlatform: tsaDecision?.targetPlatform ?? "",
            targetTimeline: tsaDecision?.targetTimeline ?? "",
            rationale: tsaDecision?.rationale ?? "",
          },
          longTerm: {
            targetDisposition: longTermDecision?.targetDisposition ?? "",
            status: longTermDecision?.status ?? "",
            targetDate: longTermDecision?.targetDate
              ? longTermDecision.targetDate.toISOString().slice(0, 10)
              : "",
            targetPlatform: longTermDecision?.targetPlatform ?? "",
            targetTimeline: longTermDecision?.targetTimeline ?? "",
            rationale: longTermDecision?.rationale ?? "",
          },
        }}
      />
    </div>
  );
}
