"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useState as useClientState } from "react";

interface HDBRecord {
  _id: string | number;
  town: string;
  flat_type: string;
  resale_price: string;
  block: string;
  street_name: string;
  month: string;
}

const PAGE_SIZE = 20;

async function fetchHDBData(offset: number, limit: number): Promise<HDBRecord[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const url = baseUrl + `/api/hdbdata?offset=${offset}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.success) {
    return data.records;
  }
  return [];
}

export default function ListingPage() {
  const [records, setRecords] = useState<HDBRecord[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef<HTMLDivElement | null>(null);
  const [navOpen, setNavOpen] = useClientState(false);
  

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const newRecords = await fetchHDBData(offset, PAGE_SIZE);
    setRecords((prev) => [...prev, ...newRecords]);
    setOffset((prev) => prev + PAGE_SIZE);
    setHasMore(newRecords.length === PAGE_SIZE);
    setLoading(false);
  }, [offset, loading, hasMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!loader.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1 }
    );
    observer.observe(loader.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  return (
    <div style={{ background: '#e0f2ff', minHeight: '100vh', width: '100%' }}> {/* #e0f2ff is a light blue, change as desired */}
      {/* Top Bar */}
      <div className="w-full bg-blue-900 text-white flex items-center px-6 py-4 relative shadow-md">
        <button
          className="mr-4 focus:outline-none"
          onClick={() => setNavOpen((open) => !open)}
          aria-label="Open navigation menu"
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-2xl font-bold tracking-wide">HDBFinder</span>
        {/* Dropdown Navigation */}
        {navOpen && (
          <div className="absolute left-0 top-full mt-2 w-56 bg-white text-blue-900 rounded-lg shadow-lg z-50 border border-blue-200 animate-fade-in">
            <Link href="/recomended" className="block px-6 py-3 hover:bg-blue-50">View Reccomended</Link>
            <Link href="/bookmarked" className="block px-6 py-3 hover:bg-blue-50">View Bookmarked</Link>
            <Link href="/account" className="block px-6 py-3 hover:bg-blue-50">Account</Link>
            <Link href="/userinfo" className="block px-6 py-3 hover:bg-blue-50">User Info</Link>
            <Link href="/logout" className="block px-6 py-3 hover:bg-blue-50">Logout</Link>
          </div>
        )}
      </div>

  {/* Listing Content */}
  <div className="flex flex-col items-center py-8 gap-8">
        {records.map((rec, i) => {
            const compositeKey = `${rec.block}__${rec.street_name}__${rec.flat_type}__${rec.month}__${offset + i}`;
        return(
            
          <Link
            key={rec._id}
            href={`listing/${encodeURIComponent(compositeKey)}`}
            className="w-3/4 rounded-3xl bg-white shadow-lg p-8 flex flex-col items-start hover:scale-105 transition-transform duration-200 border-2 border-blue-200"
            style={{ minHeight: "16vh", minWidth: "75vw", maxWidth: "75vw" }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: '#000' }}>
              {rec.town}, {rec.flat_type}
            </div>
            <div className="text-2xl font-semibold" style={{ color: '#000' }}>
              ${rec.resale_price}
            </div>
          </Link>
        )})}
        <div ref={loader} style={{ height: 40 }} />
        {loading && <div className="text-lg text-gray-500">Loading...</div>}
        {!hasMore && <div className="text-lg text-gray-400">No more listings.</div>}
      </div>
    </div>
  );
}
