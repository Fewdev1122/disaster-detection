import Layout from "../../components/Layout";

export default function RegisterPendingPage({
  requestId = "-",
  status = "pending_review",
  onRegisterAnother,
}) {
  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f7fb] px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h1 className="text-xl font-semibold text-gray-900">
                ส่งคำขอสมัครสำเร็จ
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                ระบบได้รับข้อมูลหน่วยกู้ภัยของคุณแล้ว และกำลังรอผู้ดูแลตรวจสอบ
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-medium text-amber-800">
                  สถานะปัจจุบัน: {status}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  หลังผู้ดูแลอนุมัติแล้ว ระบบสามารถต่อไปยังขั้นตอนเชื่อม LINE กลุ่ม
                  และเปิดรับแจ้งเหตุอัตโนมัติได้
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs text-gray-500">รหัสคำขอ</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {requestId}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs text-gray-500">สถานะ</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {status}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 px-4 py-4">
                <p className="text-sm font-medium text-gray-900">
                  ขั้นตอนถัดไป
                </p>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <p>• รอผู้ดูแลระบบตรวจสอบข้อมูลหน่วยกู้ภัย</p>
                  <p>• ตรวจสอบว่าเบอร์โทรและตำแหน่งที่ตั้งถูกต้อง</p>
                  <p>• เมื่อผ่านอนุมัติแล้วจึงค่อยเชื่อม LINE กลุ่ม</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onRegisterAnother}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  สมัครหน่วยใหม่อีกครั้ง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}