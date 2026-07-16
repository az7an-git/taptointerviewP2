// Removed unused React import
import { LucideIcon } from "lucide-react";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label: string;
  name?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  variant?: "default" | "ghost";
  hideLabel?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "grid";
}

export default function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  icon: Icon,
  error,
  className = "",
  variant = "default",
  hideLabel = false,
  disabled = false,
  orientation = "vertical",
}: RadioGroupProps) {
  const groupName = name || label.replace(/\s+/g, "-").toLowerCase();
  const isGhost = variant === "ghost";
  const isHorizontal = orientation === "horizontal";
  const isGrid = orientation === "grid";

  const optionBaseClass = (checked: boolean) => {
    if (isGrid || isHorizontal) {
      return `px-3 py-2 rounded-xl border text-sm font-medium normal-case tracking-normal ${checked
        ? isGhost
          ? "bg-orange-500 border-orange-500 text-white"
          : "bg-[#FF512F]/15 border-[#FF512F] text-[#FF512F]"
        : isGhost
          ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
          : "bg-gray-50/50 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-white hover:text-gray-900"
        }`;
    }

    return `w-full px-3 py-2.5 rounded-lg border ${checked
      ? isGhost
        ? "bg-[#FF512F]/15 border-[#FF512F] ring-1 ring-[#FF512F]/40 text-white"
        : "bg-[#FF512F]/10 border-[#FF512F] text-[#FF512F]"
      : isGhost
        ? "bg-white/5 border-white/10 text-gray-200 hover:border-white/20 hover:bg-white/[0.08]"
        : "bg-gray-50/50 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-white"
      }`;
  };

  return (
    <fieldset
      disabled={disabled}
      className={`select-none border-0 p-0 m-0 min-w-0 ${hideLabel ? "space-y-0" : "space-y-2"} ${className}`}
    >
      {hideLabel ? (
        <legend className="sr-only">{label}</legend>
      ) : (
        <legend
          className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-1 mb-2 ${isGhost ? "text-gray-300" : "text-gray-900"}`}
        >
          {Icon && <Icon className={`w-3.5 h-3.5 ${isGhost ? "" : "text-[#FF512F]"}`} />}
          {label}
        </legend>
      )}

      <div
        className={
          isGrid
            ? "flex flex-col gap-1.5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-2"
            : isHorizontal
              ? "flex flex-wrap gap-2"
              : "flex flex-col gap-1.5"
        }
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value || "__empty__"}
              className={`inline-flex cursor-pointer transition-colors ${isGrid
                ? "w-full flex-row items-center gap-2 justify-start py-2.5 px-3"
                : "items-center gap-2"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""} ${optionBaseClass(checked)}`}
            >
              <input
                type="radio"
                name={groupName}
                value={opt.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                className={`flex-shrink-0 rounded-full border-2 flex items-center justify-center ${isGrid || isHorizontal ? "w-3.5 h-3.5" : "w-4 h-4"
                  } ${checked
                    ? "border-[#FF512F] bg-[#FF512F]"
                    : isGhost
                      ? "border-white/30 bg-transparent"
                      : "border-gray-400 bg-white"
                  }`}
                aria-hidden
              >
                {checked && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span
                className={`leading-snug ${isGrid ? "text-sm" : ""} ${isGrid || isHorizontal
                  ? ""
                  : checked && isGhost
                    ? "text-sm font-semibold text-white"
                    : isGhost
                      ? "text-sm font-medium text-gray-400"
                      : "text-sm font-medium"
                  }`}
              >
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <div className="min-h-[20px]">
          <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {error}
          </p>
        </div>
      )}
    </fieldset>
  );
}
