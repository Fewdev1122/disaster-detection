export default function RecentIncidentsPanel({ incidents = [] }) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Recent incidents
        </h2>
      </div>

      <div className="divide-y">
        {incidents.map((i) => (
          <div key={i.id} className="px-4 py-3 text-sm flex justify-between">
            <div>
              <div className="font-medium text-slate-800">
                {i.disaster_type}
              </div>
              <div className="text-slate-500">
                {new Date(i.created_at).toLocaleString()}
              </div>
            </div>

            <div className="text-slate-600">
              {(i.confidence * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}