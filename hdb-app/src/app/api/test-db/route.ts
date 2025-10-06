export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  try {
    // 1️⃣ Connect to Mongo
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // 2️⃣ Insert a test user (change name each time to avoid unique key conflict)
    const timestamp = Date.now();
    const testUser = await User.create({
      username: `testuser_${timestamp}`,
      password: "temporary123",
      income: "4000",
      citizenship: "Singaporean",
      householdSize: 3,
      loan: "HDB Loan",
      flatType: "4-room",
      budget: "600000",
      area: "Jurong West",
      leaseLeft: "80 years",
    });

    console.log("✅ Test user inserted:", testUser.username);

    // 3️⃣ Return success JSON
    return NextResponse.json({
      ok: true,
      message: "MongoDB connected & user inserted successfully!",
      user: {
        id: testUser._id,
        username: testUser.username,
      },
    });
  } catch (err: any) {
    console.error("❌ Mongo test failed:", err);
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
