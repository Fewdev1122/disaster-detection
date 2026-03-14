import Field from "./Field";
import SectionCard from "./SectionCard";
import { PinIcon, CheckIcon } from "./icons";
import { inputClass } from "../../constants/registerForm";

export default function LocationDetailSection({ form, onChange }) {
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

      {form.baseLat && form.baseLng ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckIcon size={14} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-900">
                เลือกตำแหน่งฐานเรียบร้อยแล้ว
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                {form.district || "–"}, {form.province || "–"}
              </p>
              <p className="mt-1 break-all text-xs leading-5 text-emerald-700">
                lat: {form.baseLat}, lng: {form.baseLng}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          ยังไม่ได้เลือกตำแหน่งบนแผนที่
        </div>
      )}
    </SectionCard>
  );
}