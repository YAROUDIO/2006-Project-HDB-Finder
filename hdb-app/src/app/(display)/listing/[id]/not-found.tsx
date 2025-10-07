import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e0f2ff]">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md border-2 border-blue-200 flex flex-col items-center">
        <div className="text-5xl font-bold text-blue-900 mb-4">404</div>
        <div className="text-2xl font-bold text-blue-900 mb-2">Listing Not Found</div>
        <div className="text-lg text-blue-700 mb-6">Sorry, we couldn't find the HDB listing you were looking for.</div>
        <Link href="/display/listing" className="px-6 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">Back to Listings</Link>
      </div>
    </div>
  );
}
