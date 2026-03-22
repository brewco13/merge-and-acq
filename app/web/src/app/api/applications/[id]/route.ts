
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();

    console.log("PATCH application id:", id);
    console.log("PATCH body:", body);

    const existingOwnership = await prisma.ownership.findFirst({
      where: { applicationId: id },
      orderBy: { createdAt: "asc" },
    });

    await prisma.application.update({
      where: { id },
      data: {},
    });

    if (
      body.businessOwner !== undefined ||
      body.technicalOwner !== undefined ||
      body.businessDecisionOwner !== undefined ||
      body.technicalDecisionOwner !== undefined
    ) {
      if (existingOwnership) {
        await prisma.ownership.update({
          where: { id: existingOwnership.id },
          data: {
            businessOwner: body.businessOwner ?? null,
            technicalOwner: body.technicalOwner ?? null,
            businessDecisionOwner: body.businessDecisionOwner ?? null,
            technicalDecisionOwner: body.technicalDecisionOwner ?? null,
          },
        });
      } else {
        await prisma.ownership.create({
          data: {
            applicationId: id,
            businessOwner: body.businessOwner ?? null,
            technicalOwner: body.technicalOwner ?? null,
            businessDecisionOwner: body.businessDecisionOwner ?? null,
            technicalDecisionOwner: body.technicalDecisionOwner ?? null,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/applications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
