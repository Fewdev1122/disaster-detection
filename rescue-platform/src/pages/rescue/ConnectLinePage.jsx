import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";

export default function ConnectLinePage() {
  const verificationCode = "RESCUE-48291";

  return (
    <Layout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <PageHeader
              title="เชื่อม LINE กลุ่ม"
              subtitle="เชิญ LINE Bot เข้ากลุ่ม และส่งรหัสยืนยันเพื่อเชื่อมต่อหน่วยกู้ภัยเข้ากับระบบ"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-5">
              <section className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    รหัสยืนยัน
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ใช้ส่งในกลุ่ม LINE ที่ต้องการเชื่อมต่อ
                  </p>
                </div>

                <div className="px-5 py-5">
                  <div className="border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Verification Code
                    </p>
                    <p className="mt-2 break-all text-2xl font-semibold tracking-wide text-slate-900">
                      {verificationCode}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="xl:col-span-7">
              <section className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    ขั้นตอนการเชื่อมต่อ
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ทำตามลำดับเพื่อให้ระบบผูก LINE กลุ่มกับหน่วยกู้ภัยได้สำเร็จ
                  </p>
                </div>

                <div className="px-5 py-5">
                  <div className="space-y-4">
                    <StepItem
                      number="1"
                      title="เชิญ LINE Bot เข้ากลุ่ม"
                      description="เพิ่ม LINE Bot ของระบบเข้าไปในกลุ่มหน่วยกู้ภัยที่ต้องการใช้รับแจ้งเหตุ"
                    />
                    <StepItem
                      number="2"
                      title="ส่งรหัสยืนยันในกลุ่ม"
                      description="คัดลอกรหัสยืนยันด้านซ้าย แล้วส่งข้อความดังกล่าวในกลุ่ม LINE"
                    />
                    <StepItem
                      number="3"
                      title="รอระบบเชื่อมต่ออัตโนมัติ"
                      description="เมื่อระบบตรวจพบรหัสยืนยัน กลุ่มจะถูกผูกกับหน่วยกู้ภัยโดยอัตโนมัติ"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    รีเฟรชสถานะ
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StepItem({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-300 bg-white text-xs font-semibold text-slate-700">
        {number}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}