import React from "react";
import DatePicker from "@/common/ui/DatePicker";
import TimePicker from "@/common/ui/TimePicker";
import { Spinner } from "@/common/ui/Spinner";
import type { LocalWindowInput } from "@/common/utils/queueWindowDatetime";
import { getDefaultFutureWindowTimes, todayDateString } from "../../utils/jobPublishValidation";

export type { LocalWindowInput };

interface AddWindowFormProps {
  isSaving: boolean;
  onCancel: () => void;
  onSchedule: (input: LocalWindowInput) => void;
}

export function AddWindowForm({ isSaving, onCancel, onSchedule }: AddWindowFormProps) {
  const defaults = getDefaultFutureWindowTimes();
  const [startDate, setStartDate] = React.useState(defaults.startDate);
  const [startTime, setStartTime] = React.useState(defaults.startTime);
  const [endDate, setEndDate] = React.useState(defaults.endDate);
  const [endTime, setEndTime] = React.useState(defaults.endTime);

  const todayMinDate = todayDateString();
  const endMinDate = startDate && startDate > todayMinDate ? startDate : todayMinDate;

  React.useEffect(() => {
    if (startDate > endDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule({
      startDate,
      startTime,
      endDate,
      endTime,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#FFF5F2]/80 border border-[#FF512F]/15 rounded-2xl p-4 sm:p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 overflow-visible"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Starts</label>
          <div className="grid grid-cols-1 gap-2">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              minDate={todayMinDate}
              className="w-full"
            />
            <TimePicker value={startTime} onChange={setStartTime} className="w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ends</label>
          <div className="grid grid-cols-1 gap-2">
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              minDate={endMinDate}
              className="w-full"
            />
            <TimePicker value={endTime} onChange={setEndTime} className="w-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-3 border-t border-[#FF512F]/10">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[44px] px-4 py-2.5 bg-[#FF512F] text-white text-xs font-bold rounded-xl hover:bg-[#E04020] shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
          >
            {isSaving && <Spinner className="w-3.5 h-3.5 border-t-2 border-b-2 border-white" />}
            Schedule
          </button>
        </div>
      </div>
    </form>
  );
}
