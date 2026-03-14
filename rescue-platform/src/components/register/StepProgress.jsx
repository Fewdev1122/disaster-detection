import { CheckIcon } from "./icons";

export default function StepProgress({ currentStep = 1 }) {
  const steps = [
    { id: 1, label: "สมัครหน่วยกู้ภัย" },
    { id: 2, label: "เชื่อม LINE กลุ่ม" },
    { id: 3, label: "พร้อมใช้งาน" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`flex items-center ${!isLast ? "flex-1" : ""}`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`
                  flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition
                  
                  ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-red-500 text-white ring-4 ring-red-100"
                      : "border border-gray-200 bg-white text-gray-400"
                  }
                  
                `}
                >
                  {isCompleted ? <CheckIcon size={16} /> : step.id}
                </div>

                <p
                  className={`
                  mt-2 text-xs leading-tight
                  ${
                    isCompleted || isCurrent
                      ? "font-medium text-gray-800"
                      : "text-gray-400"
                  }
                `}
                >
                  {step.label}
                </p>
              </div>

              {!isLast && (
                <div className="mx-3 flex-1">
                  <div
                    className={`h-[2px] w-full ${
                      step.id < currentStep ? "bg-green-400" : "bg-gray-200"
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