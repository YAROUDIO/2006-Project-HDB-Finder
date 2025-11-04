import { NextResponse } from "next/server";
import { mockUser } from "../../../../lib/mock";

export async function GET() {
  const { loan, flatType, budget, area, leaseLeft } = mockUser;
  return NextResponse.json({ user: { loan, flatType, budget, area, leaseLeft } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { loan, flatType, budget, area, leaseLeft } = body || {};
  Object.assign(mockUser, {
    ...(loan !== undefined ? { loan } : {}),
    ...(flatType !== undefined ? { flatType } : {}),
    ...(budget !== undefined ? { budget: isNaN(Number(budget)) ? mockUser.budget : Number(budget) } : {}),
    ...(area !== undefined ? { area } : {}),
    ...(leaseLeft !== undefined ? { leaseLeft: isNaN(Number(leaseLeft)) ? mockUser.leaseLeft : Number(leaseLeft) } : {}),
  });
  return NextResponse.json({ message: "Saved (mock)" });
}
