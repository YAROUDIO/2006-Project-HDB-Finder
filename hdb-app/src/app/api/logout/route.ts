import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ message: "Logged out" });
    // Clear the username cookie
    res.cookies.set("username", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
