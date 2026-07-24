import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Earliest selectable date (YYYY-MM-DD). Days before this are disabled. */
  minDate?: string;
  /** Earliest year in the year dropdown (default: current year − 80) */
  minYear?: number;
  /** Latest year in the year dropdown (default: current year + 10) */
  maxYear?: number;
}

function parseDateOnly(value: string): Date | null {
  const parsed = new Date(value + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const currentCalendarYear = new Date().getFullYear();
const DEFAULT_MIN_YEAR = currentCalendarYear - 80;
const DEFAULT_MAX_YEAR = currentCalendarYear + 10;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type CalendarMenu = "month" | "year" | null;

interface CalendarSelectOption {
  value: string;
  label: string;
}

interface CalendarSelectProps {
  value: string;
  options: CalendarSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  listClassName?: string;
}

function CalendarSelect({
  value,
  options,
  onChange,
  ariaLabel,
  isOpen,
  onOpenChange,
  className = "",
  listClassName = "",
}: CalendarSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      selectedItemRef.current?.scrollIntoView({ block: "center" });
    });
  }, [isOpen, value]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={containerRef} className={`relative min-w-0 flex-1 ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => onOpenChange(!isOpen)}
        className={`w-full flex items-center justify-between gap-1 text-xs font-bold text-gray-800 bg-gray-50 border rounded-lg px-2.5 py-2.5 touch-manipulation transition-all ${isOpen
          ? "border-[#FF512F] ring-2 ring-[#FF512F]/10 bg-white"
          : "border-gray-200 hover:border-gray-300"
          }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+4px)] z-[110] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${listClassName}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          <div className="max-h-44 overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin]">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  ref={active ? selectedItemRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    onOpenChange(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold touch-manipulation transition-colors ${active
                    ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white"
                    : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface CalendarPanelProps {
  year: number;
  month: number;
  minYear: number;
  maxYear: number;
  prevMonthDays: number[];
  currentMonthDays: number[];
  nextMonthDays: number[];
  onPrevMonth: (e: React.MouseEvent) => void;
  onNextMonth: (e: React.MouseEvent) => void;
  onMonthChange: (monthIndex: number) => void;
  onYearChange: (year: number) => void;
  onSelectDay: (day: number, isCurrentMonth: "prev" | "current" | "next") => void;
  isSelected: (day: number, isCurrentMonth: "prev" | "current" | "next") => boolean;
  isDayDisabled: (day: number, isCurrentMonth: "prev" | "current" | "next") => boolean;
  canGoPrevMonth: boolean;
  isMobile?: boolean;
}

function CalendarPanel({
  year,
  month,
  minYear,
  maxYear,
  prevMonthDays,
  currentMonthDays,
  nextMonthDays,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
  onYearChange,
  onSelectDay,
  isSelected,
  isDayDisabled,
  canGoPrevMonth,
  isMobile = false,
}: CalendarPanelProps) {
  const dayCellClass = isMobile
    ? "h-10 sm:h-8 rounded-lg text-sm font-bold"
    : "h-8 rounded-lg text-xs font-bold";

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const [openMenu, setOpenMenu] = React.useState<CalendarMenu>(null);

  const monthOptions = monthNames.map((name, index) => ({
    value: String(index),
    label: name,
  }));

  const yearOptions = years.map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const closeMenus = () => setOpenMenu(null);

  return (
    <>
      <div className="relative z-20 flex items-center gap-1.5 sm:gap-2 pb-3 border-b border-gray-50 mb-3">
        <button
          type="button"
          disabled={!canGoPrevMonth}
          onClick={(e) => {
            closeMenus();
            onPrevMonth(e);
          }}
          className="p-2 sm:p-1 shrink-0 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        <CalendarSelect
          value={String(month)}
          options={monthOptions}
          ariaLabel="Select month"
          isOpen={openMenu === "month"}
          onOpenChange={(open) => setOpenMenu(open ? "month" : null)}
          onChange={(v) => onMonthChange(Number(v))}
        />

        <CalendarSelect
          value={String(year)}
          options={yearOptions}
          ariaLabel="Select year"
          isOpen={openMenu === "year"}
          onOpenChange={(open) => setOpenMenu(open ? "year" : null)}
          onChange={(v) => onYearChange(Number(v))}
          className="max-w-[5.25rem] sm:max-w-none"
        />

        <button
          type="button"
          onClick={(e) => {
            closeMenus();
            onNextMonth(e);
          }}
          className="p-2 sm:p-1 shrink-0 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer touch-manipulation"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        {weekdays.map((d) => (
          <div key={d} className="h-6 flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {prevMonthDays.map((d) => {
          const disabled = isDayDisabled(d, "prev");
          return (
            <button
              key={`prev-${d}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDay(d, "prev")}
              className={`${dayCellClass} font-medium flex items-center justify-center transition-all touch-manipulation ${disabled
                ? "text-gray-200 cursor-not-allowed"
                : "text-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
            >
              {d}
            </button>
          );
        })}

        {currentMonthDays.map((d) => {
          const active = isSelected(d, "current");
          const disabled = isDayDisabled(d, "current");
          return (
            <button
              key={`curr-${d}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDay(d, "current")}
              className={`${dayCellClass} flex items-center justify-center transition-all touch-manipulation ${disabled
                ? "text-gray-300 cursor-not-allowed"
                : active
                  ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white shadow-md shadow-[#FF512F]/20 cursor-pointer"
                  : "text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                }`}
            >
              {d}
            </button>
          );
        })}

        {nextMonthDays.map((d) => {
          const disabled = isDayDisabled(d, "next");
          return (
            <button
              key={`next-${d}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDay(d, "next")}
              className={`${dayCellClass} font-medium flex items-center justify-center transition-all touch-manipulation ${disabled
                ? "text-gray-200 cursor-not-allowed"
                : "text-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
  minDate: minDateProp,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
}: DatePickerProps) {
  const minDate = minDateProp ? parseDateOnly(minDateProp) : null;
  const effectiveMinYear = minDate ? Math.max(minYear, minDate.getFullYear()) : minYear;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    if (value) {
      const parsed = new Date(value + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        setCurrentMonth(parsed);
      }
    }
  }, [value]);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDaysToShow = startDayOfWeek;
  const totalSlots = 42;
  const nextMonthDaysToShow = totalSlots - (prevMonthDaysToShow + daysInMonth);

  const prevMonthDays: number[] = [];
  for (let i = daysInPrevMonth - prevMonthDaysToShow + 1; i <= daysInPrevMonth; i++) {
    prevMonthDays.push(i);
  }

  const currentMonthDays: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const nextMonthDays: number[] = [];
  for (let i = 1; i <= nextMonthDaysToShow; i++) {
    nextMonthDays.push(i);
  }

  const getDayDate = (day: number, isCurrentMonth: "prev" | "current" | "next") => {
    let targetYear = year;
    let targetMonth = month;

    if (isCurrentMonth === "prev") {
      targetMonth = month - 1;
      if (targetMonth < 0) {
        targetMonth = 11;
        targetYear = year - 1;
      }
    } else if (isCurrentMonth === "next") {
      targetMonth = month + 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear = year + 1;
      }
    }

    return new Date(targetYear, targetMonth, day);
  };

  const isDayDisabled = (day: number, isCurrentMonth: "prev" | "current" | "next") => {
    if (!minDate) return false;
    const dayDate = getDayDate(day, isCurrentMonth);
    dayDate.setHours(0, 0, 0, 0);
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return dayDate < min;
  };

  const canGoPrevMonth =
    !minDate || new Date(year, month, 1) > new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canGoPrevMonth) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonth(new Date(year, monthIndex, 1));
  };

  const handleYearChange = (nextYear: number) => {
    const clamped = Math.min(maxYear, Math.max(minYear, nextYear));
    setCurrentMonth(new Date(clamped, month, 1));
  };

  const handleSelectDay = (day: number, isCurrentMonth: "prev" | "current" | "next") => {
    if (isDayDisabled(day, isCurrentMonth)) return;
    onChange(toDateOnlyString(getDayDate(day, isCurrentMonth)));
    setIsOpen(false);
  };

  const isSelected = (day: number, isCurrentMonth: "prev" | "current" | "next") => {
    if (!selectedDate) return false;
    const dayDate = getDayDate(day, isCurrentMonth);
    return (
      selectedDate.getDate() === dayDate.getDate() &&
      selectedDate.getMonth() === dayDate.getMonth() &&
      selectedDate.getFullYear() === dayDate.getFullYear()
    );
  };

  const formatDateLabel = () => {
    if (!selectedDate) {
      return (
        <span className="text-gray-400 font-medium whitespace-nowrap truncate">{placeholder}</span>
      );
    }
    return (
      <span className="text-gray-800 font-semibold whitespace-nowrap truncate">
        {selectedDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
      </span>
    );
  };

  const calendarProps = {
    year,
    month,
    minYear: effectiveMinYear,
    maxYear,
    prevMonthDays,
    currentMonthDays,
    nextMonthDays,
    onPrevMonth: handlePrevMonth,
    onNextMonth: handleNextMonth,
    onMonthChange: handleMonthChange,
    onYearChange: handleYearChange,
    onSelectDay: handleSelectDay,
    isSelected,
    isDayDisabled,
    canGoPrevMonth,
  };

  const mobileSheet =
    isOpen &&
    isMobile &&
    createPortal(
      <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:hidden">
        <button
          type="button"
          aria-label="Close date picker"
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
        <div
          ref={popoverRef}
          className="relative bg-white rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200 w-full"
          role="dialog"
          aria-label="Select date"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Select date
          </p>
          <CalendarPanel {...calendarProps} isMobile />
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
        className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 text-sm flex items-center gap-2.5 outline-none focus:border-[#FF512F]/40 focus:ring-4 focus:ring-[#FF512F]/5 transition-all text-left shadow-sm cursor-pointer touch-manipulation min-h-[44px] min-w-0"
      >
        <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="min-w-0 flex-1 truncate">{formatDateLabel()}</div>
      </button>

      {isOpen && !isMobile && (
        <div
          ref={popoverRef}
          className="absolute z-50 left-0 right-0 sm:left-auto sm:right-0 mt-2 sm:w-72 bg-white border border-gray-100 rounded-2xl p-4 shadow-xl shadow-gray-200/80 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <CalendarPanel {...calendarProps} />
        </div>
      )}

      {mobileSheet}
    </div>
  );
}
