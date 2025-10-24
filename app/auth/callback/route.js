import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  const { session } = await req.json();
  const cookieStore = await cookies();

  if (!session) {
    return NextResponse.json({ error: "No session" }, { status: 400 });
  }

  cookieStore.set("sb-access-token", session.access_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  cookieStore.set("sb-refresh-token", session.refresh_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return NextResponse.json({ success: true });
}
