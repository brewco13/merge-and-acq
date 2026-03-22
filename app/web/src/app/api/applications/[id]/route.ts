
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        Note: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/applications/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load application" },
      { status: 500 }
    );
  }
}

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
    if (body.noteContent !== undefined) {
      const existingUserNote = await prisma.note.findFirst({
        where: {
          applicationId: id,
          source: "USER_EDIT",
        },
        orderBy: { createdAt: "asc" },
      });

      const trimmedContent =
        typeof body.noteContent === "string" ? body.noteContent.trim() : "";

      if (existingUserNote) {
        await prisma.note.update({
          where: { id: existingUserNote.id },
          data: {
            content: trimmedContent,
          },
        });
      } else if (trimmedContent) {
        await prisma.note.create({
          data: {
            applicationId: id,
            content: trimmedContent,
            source: "USER_EDIT",
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
