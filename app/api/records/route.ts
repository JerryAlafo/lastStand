import { NextResponse } from "next/server";
import { getHistoricalRecords } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const records = await getHistoricalRecords();
  return NextResponse.json(records);
}
