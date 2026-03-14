import { CheckIcon } from "./icons";

export default function StepProgress({ currentStep = 1 }) {
  const steps = [
    { id: 1, label: "สมัครหน่วยกู้ภัย" },
    { id: 2, label: "เชื่อม LINE กลุ่ม" },
    { id: 3, label: "พร้อมใช้งาน" },
  ];

  return (
    <div className="rounded-[24px] border border-gray-200 bg-[#fafafa] px-4 py-4 lg:px-5">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`flex items-start ${!isLast ? "flex-1" : ""}`}
            >
              <div className="flex min-w-[90px] flex-col items-center gap-2">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    isCompleted || isActive
                      ? "border-red-500 bg-red-500 text-white"
                      : "border-gray-200 bg-white text-gray-400",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckIcon size={14} /> : step.id}
                </div>

                <p
                  className={[
                    "text-center text-[11px] leading-tight",
                    isActive || isCompleted
                      ? "font-medium text-gray-800"
                      : "text-gray-400",
                  ].join(" ")}
                >
                  {step.label}
                </p>
              </div>

              {!isLast && (
                <div className="mx-2 mt-5 flex-1">
                  <div
                    className={`h-px w-full ${
                      step.id < currentStep ? "bg-red-300" : "bg-gray-200"
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