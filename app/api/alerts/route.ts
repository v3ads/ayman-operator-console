import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 60;

const OPS_API_URL = process.env.OPS_API_URL ?? "http://2.24.220.78:8765";

export async function GET() {
  try {
    const res = await fetch(`${OPS_API_URL}/alerts`);
    if (!res.ok) {
      return NextResponse.json({ error: `ops-api returned ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
