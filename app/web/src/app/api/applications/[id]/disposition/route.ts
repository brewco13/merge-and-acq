import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DecisionHorizon,
  DecisionStatus,
  DispositionType,
} from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDisposition(value: unknown): DispositionType | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value as DispositionType;
}

function parseStatus(value: unknown): DecisionStatus {
  if (typeof value !== "string" || !value.trim()) return DecisionStatus.DRAFT;
  return value as DecisionStatus;
}

async function upsertDecision(params: {
  applicationId: string;
  horizon: DecisionHorizon;
  payload: Record<string, unknown>;
}) {
  const existing = await prisma.dispositionDecision.findFirst({
    where: {
      applicationId: params.applicationId,
      decisionHorizon: params.horizon,
    },
    orderBy: { createdAt: "asc" },
  });

  const data = {
    targetDisposition: parseDisposition(params.payload.targetDisposition),
    status: parseStatus(params.payload.status),
    targetDate: parseDate(params.payload.targetDate),
    targetPlatform: clean(params.payload.targetPlatform),
    targetTimeline: clean(params.payload.targetTimeline),
    rationale: clean(params.payload.rationale),
  };

  if (existing) {
    return prisma.dispositionDecision.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.dispositionDecision.create({
    data: {
      id: crypto.randomUUID(),
      applicationId: params.applicationId,
      decisionHorizon: params.horizon,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function POST(req: Request, context: RouteContext) {
  const { id: applicationId } = await context.params;
  const body = await req.json();

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  await upsertDecision({
    applicationId,
    horizon: DecisionHorizon.TSA_EXPIRATION,
    payload: body.tsa ?? {},
  });

  await upsertDecision({
    applicationId,
    horizon: DecisionHorizon.LONG_TERM,
    payload: body.longTerm ?? {},
  });

  return NextResponse.json({ ok: true });
}
