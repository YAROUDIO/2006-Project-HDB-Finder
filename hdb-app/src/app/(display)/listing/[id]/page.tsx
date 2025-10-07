import { notFound } from "next/navigation";

interface HDBRecord {
  _id: string | number;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease: string;
  resale_price: string;
}

async function getHDBRecord(id: string): Promise<HDBRecord | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const res = await fetch(baseUrl + "/api/hdbdata?id=" + encodeURIComponent(id));
  const data = await res.json();
  if (data.success && data.records && data.records.length > 0) {
    return data.records[0];
  }
  return null;
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const record = await getHDBRecord(params.id);
  if (!record) return notFound();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e0f2ff] py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-2xl border-2 border-blue-200">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          {record.town}, {record.flat_type}
        </h1>
        <div className="text-3xl text-blue-700 font-semibold mb-6">
          ${record.resale_price}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg">
          <div><span className="font-semibold">Block:</span> {record.block}</div>
          <div><span className="font-semibold">Street:</span> {record.street_name}</div>
          <div><span className="font-semibold">Storey:</span> {record.storey_range}</div>
          <div><span className="font-semibold">Floor Area:</span> {record.floor_area_sqm} sqm</div>
          <div><span className="font-semibold">Model:</span> {record.flat_model}</div>
          <div><span className="font-semibold">Lease Commence:</span> {record.lease_commence_date}</div>
          <div><span className="font-semibold">Remaining Lease:</span> {record.remaining_lease}</div>
          <div><span className="font-semibold">Month:</span> {record.month}</div>
        </div>
      </div>
    </div>
  );
}
