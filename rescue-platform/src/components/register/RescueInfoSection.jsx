import Field from "./Field";
import SectionCard from "./SectionCard";
import { HomeIcon } from "./icons";
import { inputClass } from "../../constants/registerForm";

export default function RescueInfoSection({ form, onChange }) {
  return (
    <SectionCard
      icon={<HomeIcon />}
      title="ข้อมูลหน่วยกู้ภัย"
      subtitle="กรอกข้อมูลพื้นฐานของหน่วยและช่องทางติดต่อหลัก"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="ชื่อหน่วยกู้ภัย">
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="เช่น สมาคมกู้ภัยตัวอย่าง"
              className={`${inputClass} border-slate-300 bg-white text-slate-900 placeholder:text-slate-400`}
            />
          </Field>
        </div>

        <Field label="ชื่อผู้ประสานงาน">
          <input
            name="coordinatorName"
            value={form.coordinatorName}
            onChange={onChange}
            placeholder="ชื่อผู้ติดต่อหลัก"
            className={`${inputClass} border-slate-300 bg-white text-slate-900 placeholder:text-slate-400`}
          />
        </Field>

        <Field label="เบอร์โทร">
          <input
            type="tel"
            inputMode="numeric"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="08x-xxx-xxxx"
            className={`${inputClass} border-slate-300 bg-white text-slate-900 placeholder:text-slate-400`}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="รัศมีรับผิดชอบ">
            <div className="flex items-stretch">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                name="coverageRadiusKm"
                value={form.coverageRadiusKm}
                onChange={onChange}
                placeholder="10"
                className={`${inputClass} flex-1 rounded-r-none border-r-0 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400`}
              />
              <div className="flex min-w-[72px] items-center justify-center border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-600">
                กม.
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              ระบบจะใช้ระยะนี้ในการคัดเลือกหน่วยกู้ภัยที่สามารถรับเหตุได้
            </p>
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}