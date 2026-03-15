import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({
  children,
  title = "แดชบอร์ดผู้ดูแลระบบ",
  onRefresh,
  refreshing = false,
  provinces = [],
  selectedProvince = "",
  onProvinceChange,
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={title}
          onRefresh={onRefresh}
          refreshing={refreshing}
          provinces={provinces}
          selectedProvince={selectedProvince}
          onProvinceChange={onProvinceChange}
        />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}