import { NextResponse } from "next/server";
import { mockUser } from "../../../../lib/mock";

export async function GET() {
  return NextResponse.json({ user: { ...mockUser } });
}

export async function POST(req: Request) {
  const body = await req.json();
  Object.assign(mockUser, body);
  return NextResponse.json({ message: "Saved (mock)" });
}
