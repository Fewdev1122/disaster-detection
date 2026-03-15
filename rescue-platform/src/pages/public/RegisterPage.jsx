import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import MapPicker from "../../components/MapPicker";

import RegisterHeader from "../../components/register/RegisterHeader";
import RescueInfoSection from "../../components/register/RescueInfoSection";
import LocationDetailSection from "../../components/register/LocationDetailSection";
import RegisterActions from "../../components/register/RegisterActions";
import { MapIcon } from "../../components/register/icons";
import { initialRegisterForm } from "../../constants/registerForm";
import { registerRescueUnit } from "../../services/rescueService";

const REGISTER_DRAFT_KEY = "rescue_register_draft_v1";
const REGISTER_PENDING_KEY = "rescue_register_pending_v1";

function validateRegisterForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "กรุณากรอกชื่อหน่วยกู้ภัย";
  }

  if (!form.coordinatorName.trim()) {
    errors.coordinatorName = "กรุณากรอกชื่อผู้ประสานงาน";
  }

  if (!form.phone.trim()) {
    errors.phone = "กรุณากรอกเบอร์โทร";
  } else if (!/^[0-9+\-\s()]{8,20}$/.test(form.phone.trim())) {
    errors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง";
  }

  if (!form.coverageRadiusKm || Number(form.coverageRadiusKm) <= 0) {
    errors.coverageRadiusKm = "กรุณาระบุรัศมีรับผิดชอบให้มากกว่า 0";
  }

  if (form.baseLat == null || form.baseLng == null) {
    errors.location = "กรุณาเลือกตำแหน่งบนแผนที่";
  }

  return errors;
}

function loadSavedDraft() {
  try {
    const raw = localStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return initialRegisterForm;
    return { ...initialRegisterForm, ...JSON.parse(raw) };
  } catch (err) {
    console.error("Failed to load register draft:", err);
    return initialRegisterForm;
  }
}

function clearSavedDraft() {
  try {
    localStorage.removeItem(REGISTER_DRAFT_KEY);
  } catch (err) {
    console.error("Failed to clear register draft:", err);
  }
}

function hasFormData(form) {
  return Object.entries(form).some(([key, value]) => {
    const initialValue = initialRegisterForm[key];

    if (typeof value === "string") {
      return value.trim() !== String(initialValue ?? "").trim();
    }

    return value !== initialValue && value != null;
  });
}

function InfoStrip({ hasSelectedLocation, coverageRadiusKm }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="border border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          สถานะตำแหน่ง
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {hasSelectedLocation ? "เลือกตำแหน่งแล้ว" : "ยังไม่ได้เลือก"}
        </p>
      </div>

      <div className="border border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          รัศมีครอบคลุม
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {coverageRadiusKm && Number(coverageRadiusKm) > 0
            ? `${Number(coverageRadiusKm)} กม.`
            : "-"}
        </p>
      </div>

      <div className="border border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          โหมดแบบฟอร์ม
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          สมัครหน่วยกู้ภัย
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => loadSavedDraft());
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasSelectedLocation =
    typeof form.baseLat === "number" && typeof form.baseLng === "number";

  const mapValue = useMemo(
    () => ({
      lat: form.baseLat,
      lng: form.baseLng,
    }),
    [form.baseLat, form.baseLng]
  );

  useEffect(() => {
    try {
      localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(form));
    } catch (err) {
      console.error("Failed to save register draft:", err);
    }
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasFormData(form) || submitting) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, submitting]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSubmitError("");
  };

  const handleLocationSelect = ({ lat, lng, province, district, address }) => {
    setForm((prev) => ({
      ...prev,
      baseLat: lat,
      baseLng: lng,
      province: province ?? "",
      district: district ?? "",
      address: address ?? "",
    }));

    setErrors((prev) => ({
      ...prev,
      location: "",
    }));

    setSubmitError("");
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleResetDraft = () => {
    clearSavedDraft();
    setForm(initialRegisterForm);
    setErrors({});
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateRegisterForm(form);
    setErrors(nextErrors);
    setSubmitError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);

      const result = await registerRescueUnit(form);

      const pendingData = {
        requestId: result?.request_id || result?.id || result?.data?.id || "-",
        status: result?.status || result?.data?.status || "pending_review",
        connectCode:
          result?.connect_code || result?.data?.connect_code || "-",
      };

      localStorage.setItem(REGISTER_PENDING_KEY, JSON.stringify(pendingData));

      clearSavedDraft();
      setForm(initialRegisterForm);
      setErrors({});

      navigate("/register/pending");
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "เกิดข้อผิดพลาดในการสมัคร");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <div className="mb-6">
            <RegisterHeader />
          </div>

          <div className="mb-4">
            <InfoStrip
              hasSelectedLocation={hasSelectedLocation}
              coverageRadiusKm={form.coverageRadiusKm}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="space-y-5 xl:col-span-5">
                <div className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      ข้อมูลหน่วยกู้ภัย
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      กรอกรายละเอียดพื้นฐานของหน่วยและผู้ประสานงาน
                    </p>
                  </div>
                  <div className="p-4">
                    <RescueInfoSection
                      form={form}
                      onChange={handleChange}
                      errors={errors}
                    />
                  </div>
                </div>

                <div className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      รายละเอียดพื้นที่รับผิดชอบ
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      ระบุจังหวัด อำเภอ ที่อยู่ และรัศมีการครอบคลุม
                    </p>
                  </div>
                  <div className="p-4">
                    <LocationDetailSection
                      form={form}
                      onChange={handleChange}
                      errors={errors}
                    />
                  </div>
                </div>

                {hasFormData(form) ? (
                  <div className="border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-amber-800">
                        ระบบบันทึกแบบร่างอัตโนมัติแล้ว
                      </p>
                      <button
                        type="button"
                        onClick={handleResetDraft}
                        className="text-sm font-medium text-amber-900 hover:underline"
                      >
                        ล้างข้อมูล
                      </button>
                    </div>
                  </div>
                ) : null}

                {errors.location || submitError ? (
                  <div className="border border-rose-200 bg-rose-50 px-4 py-3">
                    {errors.location ? (
                      <p className="text-sm text-rose-700">{errors.location}</p>
                    ) : null}
                    {submitError ? (
                      <p className="text-sm text-rose-700">{submitError}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="border border-slate-200 bg-white">
                  <div className="px-4 py-4">
                    <RegisterActions
                      submitting={submitting}
                      onBack={handleBack}
                      submitLabel="สมัครหน่วยกู้ภัย"
                    />
                  </div>
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="border border-slate-200 bg-white">
                  <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
                        <MapIcon />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          ตำแหน่งฐานหน่วยกู้ภัย
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          เลือกตำแหน่งบนแผนที่เพื่อกำหนดจุดฐานและพื้นที่ครอบคลุม
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                      {hasSelectedLocation ? "เลือกตำแหน่งแล้ว" : "รอเลือกตำแหน่ง"}
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Latitude
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {form.baseLat != null ? Number(form.baseLat).toFixed(6) : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Longitude
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {form.baseLng != null ? Number(form.baseLng).toFixed(6) : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          Coverage Radius
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {form.coverageRadiusKm && Number(form.coverageRadiusKm) > 0
                            ? `${Number(form.coverageRadiusKm)} กม.`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="overflow-hidden border border-slate-200">
                      <MapPicker
                        value={mapValue}
                        radiusKm={Number(form.coverageRadiusKm || 0)}
                        onChange={handleLocationSelect}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}