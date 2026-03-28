import { NextResponse } from "next/server";
import { getApplicationFilterOptions } from "@/lib/applications/queries";

export async function GET() {
  const data = await getApplicationFilterOptions();
  return NextResponse.json(data);
}
