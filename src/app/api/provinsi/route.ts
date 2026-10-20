import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { listProvinsi } from "@/lib/data";

export async function GET() {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  return NextResponse.json({ data: await listProvinsi() });
}
