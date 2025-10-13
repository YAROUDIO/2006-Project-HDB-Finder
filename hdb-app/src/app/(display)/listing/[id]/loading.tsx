export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e0f2ff]">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md border-2 border-blue-200 flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-900 rounded-full animate-spin mb-6"></div>
        <div className="text-2xl font-bold text-blue-900 mb-2">Loading Listing...</div>
        <div className="text-lg text-blue-700">Please wait while we fetch the details.</div>
      </div>
    </div>
  );
}
