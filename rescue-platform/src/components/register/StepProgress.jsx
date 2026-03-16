import { CheckIcon } from "./icons";

export default function StepProgress({ currentStep = 1 }) {
  const steps = [
    { id: 1, label: "สมัครหน่วยกู้ภัย" },
    { id: 2, label: "เชื่อม LINE กลุ่ม" },
    { id: 3, label: "พร้อมใช้งาน" },
  ];

  return (
    <div className="border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`flex items-start ${!isLast ? "flex-1" : ""}`}
            >
              <div className="flex min-w-[88px] flex-col items-center text-center">
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center border text-xs font-semibold transition",
                    isCompleted
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : isCurrent
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-400",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckIcon size={14} /> : step.id}
                </div>

                <p
                  className={[
                    "mt-2 text-[11px] leading-4",
                    isCompleted || isCurrent
                      ? "font-medium text-slate-800"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {step.label}
                </p>
              </div>

              {!isLast && (
                <div className="mx-3 mt-4 flex-1">
                  <div
                    className={`h-px w-full ${
                      step.id < currentStep ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}