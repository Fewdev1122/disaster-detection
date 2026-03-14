export default function StatusCard({ label, value, tone = "gray" }) {
  const toneClass = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${toneClass[tone]}`}>
        {value}
      </div>
    </div>
  );
}