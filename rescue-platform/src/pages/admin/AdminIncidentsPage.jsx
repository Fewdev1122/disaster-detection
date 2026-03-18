import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getRecentIncidents } from "../../services/incidentService";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}



function Panel({ title, subtitle, children }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await getRecentIncidents(100);
      setIncidents(data || []);
    } catch (err) {
      setError(err.message || "โหลดเหตุไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return incidents.filter((item) => {
      const matchType =
        typeFilter === "all" || item.disaster_type === typeFilter;

      const matchSearch =
        !keyword ||
        item.disaster_type?.toLowerCase().includes(keyword) ||
        item.rescue_units?.name?.toLowerCase().includes(keyword);

      return matchType && matchSearch;
    });
  }, [incidents, search, typeFilter]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="px-4 py-4 sm:px-6 lg:px-8">

          <div className="mb-4 border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Incidents
                </h1>
                <p className="text-sm text-slate-500">
                  ประวัติเหตุที่ระบบตรวจพบ
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหา..."
                  className="border border-slate-300 px-3 py-2 text-sm"
                />

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="all">ทุกประเภท</option>
                  <option value="fire">Fire</option>
                  <option value="flood">Flood</option>
                
                </select>

                <button
                  onClick={loadIncidents}
                  className="border border-slate-300 px-4 py-2 text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <Panel
            title="Incident history"
            subtitle="เหตุล่าสุดที่ระบบตรวจพบ"
          >
            {loading ? (
              <div className="px-4 py-10 text-sm text-slate-500">
                กำลังโหลดข้อมูล...
              </div>
            ) : error ? (
              <div className="px-4 py-10 text-sm text-rose-600">
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                        Time
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                        Image
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span
                            className={cx(
                              "px-4 py-3 text-sm ",
                             item.disaster_type
                            )}
                          >
                            {item.disaster_type}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {(item.confidence * 100).toFixed(0)}%
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {item.rescue_units?.name || "-"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {new Date(item.created_at).toLocaleString("th-TH")}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {item.image_url && (
                            <a
                              href={item.image_url}
                              target="_blank"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AdminLayout>
  );
}