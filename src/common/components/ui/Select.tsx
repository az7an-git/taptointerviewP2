import React from "react";
import { ChevronDown, LucideIcon } from "lucide-react";

interface SelectOption {
  value: string;
  label: React.ReactNode;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  placeholder?: string;
  error?: string;
  className?: string;
  buttonClassName?: string;
  variant?: "default" | "ghost";
  /** Screen-reader only label; hides the visible uppercase label (e.g. inline table rows). */
  hideLabel?: boolean;
  disabled?: boolean;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  icon: Icon,
  placeholder = "Select option...",
  error,
  className = "",
  buttonClassName = "",
  variant = "default",
  hideLabel = false,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "";

  const isGhost = variant === "ghost";

  return (
    <div className={`select-none ${hideLabel ? "space-y-0" : "space-y-2"} ${className}`} ref={containerRef}>
      <div className="relative">
        {hideLabel ? (
          <label className="sr-only">{label}</label>
        ) : (
          <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 px-1 mb-2 ${isGhost ? "text-gray-300" : "text-gray-900"}`}>
            {Icon && <Icon className={`w-3.5 h-3.5 ${isGhost ? "" : "text-[#FF512F]"}`} />}
            {label}
          </label>
        )}

        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          aria-disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`w-full px-4 ${buttonClassName || "py-2"} transition-all duration-200 flex items-center justify-between group rounded-xl shadow-sm min-w-0 ${disabled ? "cursor-not-allowed opacity-60 pointer-events-none" : "cursor-pointer"} ${isGhost
            ? `bg-white/5 border ${isOpen ? 'border-orange-500 ring-1 ring-orange-500' : 'border-white/10 hover:border-white/20'} text-white`
            : `bg-gray-50/50 border ${isOpen ? 'border-[#FF512F] bg-white shadow-[0_0_0_4px_rgba(255,81,47,0.1)]' : error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400 hover:bg-white'} text-gray-900`
            }`}
        >
          <span className={`text-sm font-medium truncate text-left flex-1 pr-2 ${value ? (isGhost ? 'text-white' : 'text-gray-900') : 'text-gray-400'}`}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && !disabled && (
          <div className={`absolute z-[100] w-full top-full left-0 mt-1.5 border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden ${isGhost ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'
            }`}>
            <div className="max-h-60 overflow-y-auto scrollbar-custom">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer select-none first:rounded-t-xl last:rounded-b-xl ${value === opt.value
                    ? (isGhost ? 'bg-orange-500 text-white' : 'bg-[#FF512F]/15 text-[#FF512F]')
                    : (isGhost ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')
                    }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="min-h-[20px]">
          <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
