import { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import MapPicker from "../../components/MapPicker";

import RegisterHeader from "../../components/register/RegisterHeader";
import RescueInfoSection from "../../components/register/RescueInfoSection";
import LocationDetailSection from "../../components/register/LocationDetailSection";
import RegisterActions from "../../components/register/RegisterActions";
import { MapIcon } from "../../components/register/icons";
import { initialRegisterForm } from "../../constants/registerForm";
import { registerRescueUnit } from "../../services/rescueService";
import RegisterPendingPage from "./RegisterPendingPage";

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

export default function RegisterPage() {
  const [form, setForm] = useState(initialRegisterForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const hasSelectedLocation =
    typeof form.baseLat === "number" && typeof form.baseLng === "number";

  const mapValue = useMemo(
    () => ({
      lat: form.baseLat,
      lng: form.baseLng,
    }),
    [form.baseLat, form.baseLng]
  );

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
      setSubmittedResult(result);
      setForm(initialRegisterForm);
      setErrors({});
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "เกิดข้อผิดพลาดในการสมัคร");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <RegisterPendingPage
        requestId={
          submittedResult?.request_id ||
          submittedResult?.id ||
          submittedResult?.data?.id ||
          "-"
        }
        status={
          submittedResult?.status ||
          submittedResult?.data?.status ||
          "pending_review"
        }
        onRegisterAnother={() => setSubmittedResult(null)}
      />
    );
  }

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