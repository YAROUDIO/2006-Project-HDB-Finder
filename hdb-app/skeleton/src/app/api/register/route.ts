import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password, rePassword } = await req.json();
  if (!username || !password || !rePassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password !== rePassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }
  // Skeleton: pretend success, no DB write
  return NextResponse.json({ message: "Registered (mock)" }, { status: 201 });
}
