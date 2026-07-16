import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, Check } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:MM" in 24-hour format (e.g., "17:30")
  onChange: (value: string) => void;
  className?: string;
}

const scrollColumnClass =
  "max-h-36 sm:max-h-44 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]";

function TimePickerPanel({
  hour,
  minute,
  period,
  hourListRef,
  minuteListRef,
  hoursList,
  minutesList,
  periodsList,
  onSelect,
  onDone,
  className = "",
}: {
  hour: string;
  minute: string;
  period: string;
  hourListRef: React.RefObject<HTMLDivElement | null>;
  minuteListRef: React.RefObject<HTMLDivElement | null>;
  hoursList: string[];
  minutesList: string[];
  periodsList: string[];
  onSelect: (h: string, m: string, p: string) => void;
  onDone?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.25rem] gap-2 ${className}`}
    >
      <div ref={hourListRef} className={`${scrollColumnClass} border-r border-gray-100 pr-2`}>
        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center pb-1.5 sticky top-0 bg-white z-10">
          Hour
        </span>
        {hoursList.map((h) => {
          const active = h === hour;
          return (
            <button
              key={`h-${h}`}
              type="button"
              data-hour={h}
              onClick={() => onSelect(h, minute, period)}
              className={`w-full py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer touch-manipulation ${active
                ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white"
                : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
            >
              {h}
            </button>
          );
        })}
      </div>

      <div ref={minuteListRef} className={`${scrollColumnClass} border-r border-gray-100 pr-2`}>
        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center pb-1.5 sticky top-0 bg-white z-10">
          Min
        </span>
        {minutesList.map((m) => {
          const active = m === minute;
          return (
            <button
              key={`m-${m}`}
              type="button"
              data-minute={m}
              onClick={() => onSelect(hour, m, period)}
              className={`w-full py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer touch-manipulation ${active
                ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white"
                : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col shrink-0 h-full">
        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center pb-1.5">
          Period
        </span>
        {periodsList.map((p) => {
          const active = p === period;
          return (
            <button
              key={`p-${p}`}
              type="button"
              onClick={() => onSelect(hour, minute, p)}
              className={`w-full py-2.5 sm:py-2 text-xs font-extrabold rounded-lg text-center transition-all cursor-pointer touch-manipulation mb-1 ${active
                ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white"
                : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
            >
              {p}
            </button>
          );
        })}
        {onDone && (
          <div className="mt-auto pt-2 hidden sm:block">
            <button
              type="button"
              onClick={onDone}
              className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
              title="Confirm time"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimePicker({ value, onChange, className = "" }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: "09", minute: "00", period: "AM" };
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";

    if (isNaN(h)) return { hour: "09", minute: "00", period: "AM" };

    const period = h >= 12 ? "PM" : "AM";
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;

    return {
      hour: String(hour12).padStart(2, "0"),
      minute: m,
      period,
    };
  };

  const { hour, minute, period } = parseTime(value);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen && !isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollActive = (container: HTMLDivElement | null, selector: string) => {
      const el = container?.querySelector(selector);
      el?.scrollIntoView({ block: "center" });
    };
    requestAnimationFrame(() => {
      scrollActive(hourListRef.current, `[data-hour="${hour}"]`);
      scrollActive(minuteListRef.current, `[data-minute="${minute}"]`);
    });
  }, [isOpen, hour, minute]);

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
  const periodsList = ["AM", "PM"];

  const handleSelect = (newHour: string, newMinute: string, newPeriod: string) => {
    let h = parseInt(newHour, 10);
    if (newPeriod === "PM" && h < 12) h += 12;
    if (newPeriod === "AM" && h === 12) h = 0;

    const formattedHour = String(h).padStart(2, "0");
    onChange(`${formattedHour}:${newMinute}`);
  };

  const panelProps = {
    hour,
    minute,
    period,
    hourListRef,
    minuteListRef,
    hoursList,
    minutesList,
    periodsList,
    onSelect: handleSelect,
    onDone: () => setIsOpen(false),
  };

  const mobileSheet =
    isOpen &&
    isMobile &&
    createPortal(
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:hidden">
        <button
          type="button"
          aria-label="Close time picker"
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
        <div
          ref={popoverRef}
          className="relative bg-white rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
          role="dialog"
          aria-label="Select time"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Select time
          </p>
          <TimePickerPanel {...panelProps} />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full py-3 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white text-sm font-bold rounded-xl touch-manipulation"
          >
            Done
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 text-sm flex items-center justify-center sm:justify-start gap-2 outline-none focus:border-[#FF512F]/40 focus:ring-4 focus:ring-[#FF512F]/5 transition-all shadow-sm cursor-pointer touch-manipulation min-h-[44px]"
      >
        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-gray-800 font-semibold whitespace-nowrap">
          {hour}:{minute} {period}
        </span>
      </button>

      {isOpen && !isMobile && (
        <div
          ref={popoverRef}
          className="absolute z-50 right-0 mt-2 w-[17.5rem] bg-white border border-gray-100 rounded-2xl p-3 shadow-xl shadow-gray-200/80 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <TimePickerPanel {...panelProps} />
        </div>
      )}

      {mobileSheet}
    </div>
  );
}
