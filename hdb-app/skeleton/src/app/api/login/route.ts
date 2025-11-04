import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { username = "demo" } = await req.json();
  // In skeleton we accept any credentials and set a cookie on the response
  const res = NextResponse.json({ message: "OK (mock)" });
  res.cookies.set("username", username, { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}
