import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { allRows, validProvinsi } from "@/lib/data";
import { buildInsight } from "@/lib/insight";

export async function GET(request: NextRequest) {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  const raw = request.nextUrl.searchParams.get("provinsi");
  const provinsi = await validProvinsi(raw);
  if (raw && !provinsi) return NextResponse.json({ error: "Provinsi tidak dikenal" }, { status: 400 });
  return NextResponse.json({ data: buildInsight(await allRows(), provinsi) });
}
