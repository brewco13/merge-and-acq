import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  computeFinalConfidenceScore,
  deriveConfidenceBand,
  normalizeManualAdjustment,
} from '@/lib/confidence/confidence-utils';

import { updateConfidenceAssessmentReview } from '@/lib/confidence/confidence-repository';
import { prisma } from '@/lib/prisma';

import type {
  ConfidenceAssessmentStatus,
  ConfidenceHorizon,
} from '@/lib/confidence/confidence-types';

const paramsSchema = z.object({
  id: z.string().min(1),
  horizon: z.enum(['TSA', 'LONG_TERM']),
});

const bodySchema = z.object({
  manualAdjustment: z.number().int().min(-100).max(100).optional(),
  overrideReason: z.string().trim().max(1000).nullable().optional(),
  reviewNotes: z.string().trim().max(4000).nullable().optional(),
  assessmentStatus: z
    .enum(['SYSTEM_CALCULATED', 'REVIEWED', 'APPROVED', 'OVERRIDDEN'])
    .optional(),
  reviewerName: z.string().trim().max(255).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; horizon: string }> },
) {
  try {
    const rawParams = await context.params;
    const parsedParams = paramsSchema.parse(rawParams);
    const body = bodySchema.parse(await request.json());

    const horizonType = parsedParams.horizon as ConfidenceHorizon;

    const existing = await prisma.confidenceAssessment.findUnique({
      where: {
        applicationId_horizonType: {
          applicationId: parsedParams.id,
          horizonType,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Confidence assessment not found.' },
        { status: 404 },
      );
    }

    const manualAdjustment =
      body.manualAdjustment !== undefined
        ? normalizeManualAdjustment(body.manualAdjustment)
        : existing.manualAdjustment;

    const finalScore = computeFinalConfidenceScore(
      existing.calculatedScore,
      manualAdjustment,
    );

    const confidenceBand = deriveConfidenceBand(finalScore);

    const nextStatus =
      (body.assessmentStatus as ConfidenceAssessmentStatus | undefined) ??
      existing.assessmentStatus;

    const reviewedAt =
      nextStatus === 'SYSTEM_CALCULATED' ? null : new Date();

    const updated = await updateConfidenceAssessmentReview(prisma, {
      applicationId: parsedParams.id,
      horizonType,
      data: {
        manualAdjustment,
        overrideReason:
          body.overrideReason !== undefined
            ? body.overrideReason
            : existing.overrideReason,
        reviewNotes:
          body.reviewNotes !== undefined
            ? body.reviewNotes
            : existing.reviewNotes,
        assessmentStatus: nextStatus,
        reviewerName:
          body.reviewerName !== undefined
            ? body.reviewerName
            : existing.reviewerName,
        reviewedAt,
        finalScore,
        confidenceBand,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request.', details: error.flatten() },
        { status: 400 },
      );
    }

    console.error('PATCH confidence review failed', error);

    return NextResponse.json(
      { error: 'Failed to update confidence review.' },
      { status: 500 },
    );
  }
}
