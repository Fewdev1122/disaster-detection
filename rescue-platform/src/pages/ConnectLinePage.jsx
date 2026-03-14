import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";

export default function ConnectLinePage() {
  const verificationCode = "RESCUE-48291";

  return (
    <Layout>
      <PageHeader
        title="เชื่อม LINE กลุ่ม"
        subtitle="เชิญ LINE Bot เข้ากลุ่มและส่งรหัสยืนยันด้านล่าง"
      />

      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border">
          <div className="text-sm text-gray-500">รหัสยืนยัน</div>
          <div className="text-2xl font-bold mt-2">{verificationCode}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border">
          <h2 className="font-semibold">ขั้นตอน</h2>
          <ol className="mt-3 text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>เชิญ LINE Bot เข้ากลุ่มหน่วยกู้ภัย</li>
            <li>ส่งรหัสยืนยันนี้ในกลุ่ม</li>
            <li>ระบบจะเชื่อมกลุ่มให้โดยอัตโนมัติ</li>
          </ol>
        </div>

        <button className="w-full py-4 rounded-xl bg-red-600 text-white font-semibold">
          รีเฟรชสถานะ
        </button>
      </div>
    </Layout>
  );
}