import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import StatusCard from "../../components/StatusCard";

export default function DashboardPage() {
  return (
    <Layout>
      <PageHeader
        title="Dashboard หน่วยกู้ภัย"
        subtitle="ดูสถานะหน่วยและการเชื่อม LINE"
      />

      <div className="grid gap-4">
        <StatusCard label="สถานะหน่วย" value="รอตรวจสอบ" tone="yellow" />
        <StatusCard label="สถานะ LINE" value="ยังไม่เชื่อม" tone="red" />

        <div className="bg-white rounded-2xl shadow-sm p-5 border">
          <h2 className="font-semibold text-lg">ข้อมูลหน่วย</h2>
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <div>ชื่อหน่วย: กู้ภัยพะเยา</div>
            <div>จังหวัด: พะเยา</div>
            <div>อำเภอ: เมืองพะเยา</div>
            <div>เบอร์โทร: 08x-xxx-xxxx</div>
          </div>
        </div>

        <button className="w-full py-4 rounded-xl bg-white border font-semibold">
          แก้ไขข้อมูล
        </button>
      </div>
    </Layout>
  );
}