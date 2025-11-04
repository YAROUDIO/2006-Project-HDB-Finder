import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
	await connectDB();
	try {
		const cookieStore = cookies();
		const username = (await cookieStore).get("username")?.value;
		if (!username) {
			return NextResponse.json({ error: "Username is required." }, { status: 400 });
		}
		const user = await User.findOne({ username });
		if (!user) {
			return NextResponse.json({ error: "User not found." }, { status: 404 });
		}
		return NextResponse.json({ user });
	} catch (err) {
		console.error("GET /api/userinfo error:", err);
		return NextResponse.json({ error: "Failed to fetch user info." }, { status: 500 });
	}
}

export async function POST(req: Request) {
	await connectDB();
	try {
		const body = await req.json();
		const cookieStore = cookies();
		const username = (await cookieStore).get("username")?.value;
		const {
			income,
			age,
			citizenship,
			flatType,
			downPaymentBudget,
			area
		} = body;

		if (!username) {
			return NextResponse.json({ error: "Username is required." }, { status: 400 });
		}

		// Convert age and downPaymentBudget to numbers if provided (form sends strings)
		const ageNum = age && age !== "" ? Number(age) : undefined;
		const downPaymentBudgetNum = downPaymentBudget && downPaymentBudget !== "" ? Number(downPaymentBudget) : undefined;

		// Build update object, only including numeric fields if they're valid numbers
		const updateData: any = {
			income,
			citizenship,
			flatType,
			area
		};
		
		// Only set age if we have a valid number
		if (ageNum !== undefined && !isNaN(ageNum)) {
			updateData.age = ageNum;
		}

		// Only set downPaymentBudget if we have a valid number
		if (downPaymentBudgetNum !== undefined && !isNaN(downPaymentBudgetNum)) {
			updateData.downPaymentBudget = downPaymentBudgetNum;
		}

		// Update user preferences
		const updated = await User.findOneAndUpdate(
			{ username },
			updateData,
			{ new: true }
		);

		if (!updated) {
			return NextResponse.json({ error: "User not found." }, { status: 404 });
		}
		return NextResponse.json({ message: "User info updated.", user: updated });
	} catch (err) {
		console.error("POST /api/userinfo error:", err);
		return NextResponse.json({ error: "Failed to update user info." }, { status: 500 });
	}
}
