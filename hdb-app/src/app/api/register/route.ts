export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";


export async function POST(req: Request) {
  const { username, email, password, rePassword, ...rest } = await req.json();

  if (!username || !email || !password || !rePassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  const emailStr = String(email).toLowerCase().trim();
  const emailOk = /.+@.+\..+/.test(emailStr);
  if (!emailOk) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password !== rePassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  

  try {
    await connectDB();
    const uname = String(username).toLowerCase().trim();

    const [existingByUsername, existingByEmail] = await Promise.all([
      User.findOne({ username: uname }),
      User.findOne({ email: emailStr })
    ]);
    if (existingByUsername) {
      return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }
    if (existingByEmail) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      username: uname,
      email: emailStr,
      password: passwordHash, // or rename your schema field to passwordHash (recommended)
      ...rest,
    });

    return NextResponse.json({ message: "User registered successfully." }, { status: 201 });
  } catch (err: any) {
    console.error("Register error:", err?.message, err); // <-- see the real cause in terminal
    // Handle duplicate key explicitly
    if (err?.code === 11000) {
      const kp = (err as any).keyPattern || {};
      if (kp.username) {
        return NextResponse.json({ error: "Username already taken." }, { status: 409 });
      }
      if (kp.email) {
        return NextResponse.json({ error: "Email already in use." }, { status: 409 });
      }
      return NextResponse.json({ error: "Duplicate value for a unique field." }, { status: 409 });
    }
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
