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
        <Field label="ชื่อหน่วยกู้ภัย">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="เช่น สมาคมกู้ภัยตัวอย่าง"
            className={inputClass}
          />
        </Field>

        <Field label="ชื่อผู้ประสานงาน">
          <input
            name="coordinatorName"
            value={form.coordinatorName}
            onChange={onChange}
            placeholder="ชื่อผู้ติดต่อหลัก"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="เบอร์โทร">
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="08x-xxx-xxxx"
            className={inputClass}
          />
        </Field>

      
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="รัศมีรับผิดชอบ">
          <div className="flex items-center gap-2">
            <input
              name="coverageRadiusKm"
              value={form.coverageRadiusKm}
              onChange={onChange}
              placeholder="10"
              className={`${inputClass} flex-1`}
            />
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">
              กม.
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ระบบจะใช้ค่านี้เพื่อคัดเลือกหน่วยที่อยู่ใกล้เหตุ
          </p>
        </Field>
      </div>
    </SectionCard>
  );
}