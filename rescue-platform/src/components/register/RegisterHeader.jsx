import StepProgress from "./StepProgress";
import { ShieldIcon } from "./icons";

export default function RegisterHeader() {
  return (
    <div className="mb-6">
      <div className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-5 px-6 py-6">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
              <ShieldIcon />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
                Rescue Platform
              </p>

              <h1 className="mt-1 text-xl font-semibold text-slate-900 lg:text-2xl">
                สมัครหน่วยกู้ภัย
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                ลงทะเบียนหน่วยกู้ภัย กำหนดตำแหน่งฐาน และตั้งรัศมีรับผิดชอบ
                เพื่อให้ระบบเลือกส่งแจ้งเหตุได้อย่างเหมาะสม
              </p>
            </div>

          </div>

          <StepProgress currentStep={1} />

        </div>
      </div>
    </div>
  );
}