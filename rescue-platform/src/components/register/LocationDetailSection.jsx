import Field from "./Field";
import SectionCard from "./SectionCard";
import { PinIcon, CheckIcon } from "./icons";
import { inputClass } from "../../constants/registerForm";

export default function LocationDetailSection({ form, onChange }) {
  const hasLocation =
    typeof form.baseLat === "number" && typeof form.baseLng === "number";

  return (
    <SectionCard
      icon={<PinIcon />}
      title="รายละเอียดตำแหน่ง"
      subtitle="ข้อมูลที่อยู่และตำแหน่งที่ได้จากการเลือกบนแผนที่"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="จังหวัด">
          <input
            name="province"
            value={form.province}
            onChange={onChange}
            placeholder="เติมอัตโนมัติ"
            className={inputClass}
          />
        </Field>

        <Field label="อำเภอ">
          <input
            name="district"
            value={form.district}
            onChange={onChange}
            placeholder="เติมอัตโนมัติ"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="ที่อยู่โดยย่อ">
        <input
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="ระบบจะเติมให้อัตโนมัติจากแผนที่"
          className={inputClass}
        />
      </Field>

      {hasLocation ? (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center border border-emerald-600 bg-emerald-600 text-white">
              <CheckIcon size={12} />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                เลือกตำแหน่งฐานเรียบร้อยแล้ว
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                ระบบพร้อมใช้พิกัดนี้สำหรับการกำหนดพื้นที่รับผิดชอบ
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">
            ยังไม่ได้เลือกตำแหน่งบนแผนที่
          </p>
          <p className="mt-1 text-xs text-slate-500">
            กรุณาเลือกจุดบนแผนที่เพื่อให้ระบบระบุพิกัด จังหวัด และอำเภอ
          </p>
        </div>
      )}
    </SectionCard>
  );
}