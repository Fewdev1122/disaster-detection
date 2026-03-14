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
        requestId:
          result?.request_id ||
          result?.id ||
          result?.data?.id ||
          "-",
        status:
          result?.status ||
          result?.data?.status ||
          "pending_review",
        connectCode:
          result?.connect_code ||
          result?.data?.connect_code ||
          "-",
      };

      localStorage.setItem(
        REGISTER_PENDING_KEY,
        JSON.stringify(pendingData)
      );

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
      <div className="min-h-screen bg-[#f5f7fb] px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <RegisterHeader />

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-5">
                <RescueInfoSection
                  form={form}
                  onChange={handleChange}
                  errors={errors}
                />

                <LocationDetailSection
                  form={form}
                  onChange={handleChange}
                  errors={errors}
                />

                {hasFormData(form) && (
                  <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm text-amber-700">
                      ระบบบันทึกแบบร่างอัตโนมัติแล้ว
                    </p>
                    <button
                      type="button"
                      onClick={handleResetDraft}
                      className="text-sm font-medium text-amber-800 underline underline-offset-2"
                    >
                      ล้างข้อมูล
                    </button>
                  </div>
                )}

                {(errors.location || submitError) && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    {errors.location && (
                      <p className="text-sm text-red-700">{errors.location}</p>
                    )}
                    {submitError && (
                      <p className="text-sm text-red-700">{submitError}</p>
                    )}
                  </div>
                )}

                <RegisterActions
                  submitting={submitting}
                  onBack={handleBack}
                  submitLabel="สมัครหน่วยกู้ภัย"
                />
              </div>

              <div className="xl:col-span-7">
                <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 lg:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <MapIcon />
                      </div>

                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          เลือกตำแหน่งบนแผนที่
                        </p>
                        <p className="text-xs text-gray-500">
                          กำหนดจุดฐานและพื้นที่ครอบคลุมของหน่วยกู้ภัย
                        </p>
                      </div>
                    </div>

                    <div className="hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 lg:block">
                      {hasSelectedLocation ? "Location Selected" : "Map Console"}
                    </div>
                  </div>

                  <div className="p-4 lg:p-5">
                    <MapPicker
                      value={mapValue}
                      radiusKm={Number(form.coverageRadiusKm || 0)}
                      onChange={handleLocationSelect}
                    />
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