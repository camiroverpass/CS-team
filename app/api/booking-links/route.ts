import { NextResponse } from "next/server";
import { readAudit } from "@/lib/booking-links";

export const revalidate = 300;

export async function GET() {
  try {
    const rows = await readAudit();
    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
