import StepProgress from "./StepProgress";
import { ShieldIcon } from "./icons";

export default function RegisterHeader() {
  return (
    <div className="mb-6 lg:mb-8">
      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm lg:p-7">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500 shadow-sm">
              <ShieldIcon />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                Rescue Platform
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 lg:text-3xl">
                สมัครหน่วยกู้ภัย
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                ลงทะเบียนหน่วยกู้ภัย กำหนดตำแหน่งฐาน และตั้งรัศมีรับผิดชอบเพื่อให้ระบบเลือกส่งแจ้งเหตุได้อย่างเหมาะสม
              </p>
            </div>
          </div>

          <StepProgress currentStep={1} />
        </div>
      </div>
    </div>
  );
}