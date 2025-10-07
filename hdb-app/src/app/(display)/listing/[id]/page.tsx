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

function parseCompositeKey(key: string) {
  const [block, street_name, flat_type, month, offset] = decodeURIComponent(key).split("__");
  return { block, street_name, flat_type, month, offset };
}

async function getHDBRecordByCompositeKey(key: string) {
  const { block, street_name, flat_type, month, offset } = parseCompositeKey(key);
  // Fetch a batch (or all) and find the matching record
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/hdbdata?limit=1000&offset=${offset}`);
  const data = await res.json();
  return data.records.find(
    (rec: any) =>
      rec.block === block &&
      rec.street_name === street_name &&
      rec.flat_type === flat_type &&
      rec.month === month
  );
}
export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const record = await getHDBRecordByCompositeKey(params.id);
  if (!record) return notFound();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e0f2ff] py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-2xl border-2 border-blue-200">
        <h1 className="text-4xl font-bold mb-4 text-blue-900">
          {record.town}, {record.flat_type}
        </h1>
        <div className="text-3xl font-semibold mb-6 text-blue-700">
          ${record.resale_price}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-lg" style={{ color: '#000' }}>
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
