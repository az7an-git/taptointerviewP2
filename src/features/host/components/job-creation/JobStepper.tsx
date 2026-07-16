import { Check, FileText, Filter, CalendarClock, Sparkles, UserPlus } from "lucide-react";

export const STEPS = [
  { id: 1, name: "Job Details", icon: FileText },
  { id: 2, name: "Qualifications", icon: Filter },
  { id: 3, name: "Windows", icon: CalendarClock },
  { id: 4, name: "Interviewers", icon: UserPlus },
  { id: 5, name: "Review", icon: Sparkles },
];

interface JobStepperProps {
  currentStep: number;
}

export default function JobStepper({ currentStep }: JobStepperProps) {
  // Fill fraction: e.g. at step 3 of 4, (3-1)/(4-1) = 2/3 of the track is filled
  const fillPct = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-5 md:p-6 shadow-xl shadow-gray-200/50">
      <div className="flex items-start w-full relative">
        {/* Single absolute track spanning between first and last icon centers */}
        <div
          className="absolute h-1 bg-gray-100 rounded-full overflow-hidden"
          style={{
            // 1/(2*N) from left to right keeps track between icon centers at any zoom
            left: `${(1 / (2 * STEPS.length)) * 100}%`,
            right: `${(1 / (2 * STEPS.length)) * 100}%`,
            top: "18px",
          }}
        >
          <div
            className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-[#FF512F] to-[#FF7A00]"
            style={{ width: `${fillPct}%` }}
          />
        </div>

        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2.5 flex-1 relative z-10 min-w-0">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-700 relative z-10 ${isCompleted
                  ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white shadow-lg shadow-[#FF512F]/20"
                  : isActive
                    ? "bg-white text-[#FF512F] shadow-[0_0_0_4px_rgba(255,81,47,0.1)] scale-110"
                    : "bg-white/50 text-gray-400 border border-white/80"
                  }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#FF512F]" : ""}`} />
                )}
              </div>

              <div className="flex flex-col items-center px-1">
                <span
                  className={`text-[6px] md:text-[11px] font-bold uppercase tracking-widest transition-colors duration-500 text-center leading-tight ${isActive ? "text-gray-900" : isCompleted ? "text-gray-600" : "text-gray-400"
                    }`}
                >
                  {step.name}
                </span>
                <span
                  className={`text-[5px] md:text-[8px] font-bold uppercase tracking-[0.2em] mt-1 ${isActive ? "text-[#FF512F]" : "text-transparent"
                    }`}
                >
                  Current
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
