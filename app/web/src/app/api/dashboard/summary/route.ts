export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/dashboard/queries";

export async function GET() {
  const data = await getDashboardSummary();
  return NextResponse.json(data);
}
