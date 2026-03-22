import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const application = await prisma.application.create({
      data: {
        name: body.name,
        legacyId: body.legacyId || null,
        businessArea: body.businessArea || null,
        l1Capability: body.l1Capability || null,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications failed:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
