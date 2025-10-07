export const runtime = "nodejs"; // ensures it runs server-side

import { NextResponse } from "next/server";

export async function GET(req: { url: string | URL; }) {
  try {
    const dataset_id = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      // For debugging: return the first 10 records so we can inspect their _id values
      const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${dataset_id}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json({
        success: true,
        count: data.result.records.length,
        records: data.result.records,
      });
    } else {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);
      const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${dataset_id}&limit=${limit}&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();
      return NextResponse.json({
        success: true,
        count: data.result.records.length,
        records: data.result.records,
      });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
