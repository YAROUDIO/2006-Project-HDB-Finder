import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Bookmark from "@/models/Bookmark";

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || "");
  }
}

// GET: Get all bookmarks for a user
export async function GET(req: NextRequest) {
  await connectDB();
  const username = req.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json({ success: false, error: "Username required" }, { status: 400 });
  }
  const entry = await Bookmark.findOne({ username });
  return NextResponse.json({ success: true, bookmarks: entry?.bookmarks || [] });
}

// POST: Add a bookmark for a user
export async function POST(req: NextRequest) {
  await connectDB();
  let { username, bookmark } = await req.json();
  if (!username || !bookmark) {
    return NextResponse.json({ success: false, error: "Username and bookmark required" }, { status: 400 });
  }
  // Always store the raw, decoded compositeKey
  if (bookmark.compositeKey) {
    try {
      bookmark.compositeKey = decodeURIComponent(bookmark.compositeKey);
    } catch (e) {
      // fallback: if decode fails, keep as is
    }
  }
  let entry = await Bookmark.findOne({ username });
  if (!entry) {
    entry = new Bookmark({ username, bookmarks: [bookmark] });
  } else {
    // Prevent duplicates by compositeKey
    if (entry.bookmarks.some((b: any) => b.compositeKey === bookmark.compositeKey)) {
      return NextResponse.json({ success: false, error: "Already bookmarked" }, { status: 409 });
    }
    entry.bookmarks.push(bookmark);
  }
  await entry.save();
  return NextResponse.json({ success: true });
}

// DELETE: Remove a bookmark for a user
export async function DELETE(req: NextRequest) {
  await connectDB();
  const { username, compositeKey } = await req.json();
  if (!username || !compositeKey) {
    return NextResponse.json({ success: false, error: "Username and compositeKey required" }, { status: 400 });
  }
  const entry = await Bookmark.findOne({ username });
  if (!entry) {
    return NextResponse.json({ success: false, error: "No bookmarks found for user" }, { status: 404 });
  }
  entry.bookmarks = entry.bookmarks.filter((b: any) => b.compositeKey !== compositeKey);
  await entry.save();
  return NextResponse.json({ success: true });
}
