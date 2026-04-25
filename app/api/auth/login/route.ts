import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  const correct = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!correct || !secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!password || password !== correct) {
    // Small delay to slow brute force
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ops_session", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}
