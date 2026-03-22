import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existingOwnership = await prisma.ownership.findFirst({
      where: { applicationId: id },
      orderBy: { createdAt: "asc" },
    });

    const application = await prisma.application.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        legacyId: body.legacyId ?? undefined,
        businessArea: body.businessArea ?? undefined,
        l1Capability: body.l1Capability ?? undefined,
        l2Capability: body.l2Capability ?? undefined,
        l3Capability: body.l3Capability ?? undefined,
        description: body.description ?? undefined,
      },
    });

    if (
      body.businessOwner !== undefined ||
      body.technicalOwner !== undefined
    ) {
      if (existingOwnership) {
        await prisma.ownership.update({
          where: { id: existingOwnership.id },
          data: {
            businessOwner: body.businessOwner ?? null,
            technicalOwner: body.technicalOwner ?? null,
          },
        });
      } else {
        await prisma.ownership.create({
          data: {
            applicationId: id,
            businessOwner: body.businessOwner ?? null,
            technicalOwner: body.technicalOwner ?? null,
          },
        });
      }
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("PATCH /api/applications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
