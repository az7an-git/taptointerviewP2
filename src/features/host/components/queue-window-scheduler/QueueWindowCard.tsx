import { useState } from "react";
import { Calendar, Clock, Trash2, Pause, Play, Edit2, Check, XCircle } from "lucide-react";
import { QueueWindow } from "@/types/job";
import { formatWindowIso, localPickerToUtcIso, parseWindowIso } from "@/common/utils/queueWindowDatetime";
import { hasQueueWindowEnded } from "../../utils/jobPublishValidation";
import { normalizeWindowStatus } from "../../utils/queueWindowLive";
import { Spinner } from "@/common/ui/Spinner";
import DatePicker from "@/common/ui/DatePicker";
import TimePicker from "@/common/ui/TimePicker";
import React from "react";

interface QueueWindowCardProps {
  window: QueueWindow;
  index: number;
  disabled: boolean;
  isSaving: boolean;
  isAdmin?: boolean;
  onDelete: (index: number) => void;
  showLiveActions?: boolean;
  onPauseLive?: () => void;
  onResumeLive?: () => void;
  onExtendWindow?: (windowId: string, minutes: number) => Promise<void>;
  onCloseEarlyWindow?: (windowId: string) => Promise<void>;
  onSingleWindowEdit?: (windowId: string, payload: { starts_at?: string; ends_at?: string }) => Promise<void>;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoToPickerParts(iso: string): { date: string; time: string } {
  const parts = parseWindowIso(iso);
  if (!parts) return { date: "", time: "09:00" };
  const date = `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
  const time = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  return { date, time };
}

export function QueueWindowCard({
  window: w,
  index,
  disabled,
  isSaving,
  isAdmin = true,
  onDelete,
  showLiveActions = false,
  onPauseLive,
  onResumeLive,
  onExtendWindow,
  onCloseEarlyWindow,
  onSingleWindowEdit,
}: QueueWindowCardProps) {
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  const isPast = hasQueueWindowEnded(w);
  const normalizedStatus = normalizeWindowStatus(w.status);
  const statusLabel = normalizedStatus === "wrapping_up" ? "WRAPPING UP" : normalizedStatus.toUpperCase();
  const canPauseThis = normalizedStatus === "Open";
  const canResumeThis = normalizedStatus === "Paused";

  const [isEditing, setIsEditing] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const start = formatWindowIso(w.startTime);
  const end = formatWindowIso(w.endTime);

  const handleStartEdit = () => {
    const sParts = isoToPickerParts(w.startTime);
    const eParts = isoToPickerParts(w.endTime);
    setEditStartDate(sParts.date);
    setEditStartTime(sParts.time);
    setEditEndDate(eParts.date);
    setEditEndTime(eParts.time);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!w.id || !onSingleWindowEdit) return;
    if (!editStartDate || !editStartTime || !editEndDate || !editEndTime) return;
    setIsSavingEdit(true);
    try {
      const starts_at = localPickerToUtcIso(editStartDate, editStartTime);
      const ends_at = localPickerToUtcIso(editEndDate, editEndTime);
      await onSingleWindowEdit(w.id, { starts_at, ends_at });
      setIsEditing(false);
    } catch {
      // Error handled by caller
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-3 sm:p-4 shadow-sm transition-all space-y-3 ${isPast ? "opacity-75 grayscale-[30%]" : "hover:border-[#FF512F]/30"
        }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-lg shrink-0 ${isPast
              ? "bg-gray-100 text-gray-400"
              : normalizedStatus === "wrapping_up"
                ? "bg-amber-100 text-amber-700"
                : "bg-[#FFF5F2] text-[#FF512F]"
              }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate">
              {start.date}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 whitespace-nowrap ${normalizedStatus === "Open"
                  ? "bg-green-100 text-green-700 animate-pulse"
                  : normalizedStatus === "wrapping_up"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : normalizedStatus === "Paused"
                      ? "bg-amber-100 text-amber-700"
                      : isPast
                        ? "bg-gray-200 text-gray-600"
                        : "bg-blue-50 text-blue-600"
                }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1 shrink-0">
            {showLiveActions && isAdmin && w.id && !isPast && (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={isSaving || isEditing}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Edit window start/end time"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {normalizedStatus === "Paused" ? (
                  <button
                    type="button"
                    onClick={onResumeLive}
                    disabled={isSaving || !canResumeThis}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title="Resume queue window"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPauseLive}
                    disabled={isSaving || !canPauseThis}
                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                    title="Pause queue window"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => onDelete(index)}
              disabled={isSaving}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-1.5 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
              title="Remove window"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Time Display or Custom App DatePicker / TimePicker Form */}
      {isEditing ? (
        <div className="bg-[#FFF5F2]/80 border border-[#FF512F]/15 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Starts At</label>
              <div className="grid grid-cols-1 gap-2">
                <DatePicker
                  value={editStartDate}
                  onChange={setEditStartDate}
                  className="w-full"
                />
                <TimePicker value={editStartTime} onChange={setEditStartTime} className="w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Ends At</label>
              <div className="grid grid-cols-1 gap-2">
                <DatePicker
                  value={editEndDate}
                  onChange={setEditEndDate}
                  className="w-full"
                />
                <TimePicker value={editEndTime} onChange={setEditEndTime} className="w-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FF512F]/10">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSavingEdit}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer min-h-[38px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="px-4 py-2 bg-[#FF512F] text-white text-xs font-bold rounded-xl hover:bg-[#E04020] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
            >
              {isSavingEdit ? (
                <Spinner className="w-3.5 h-3.5 border-2 border-white/30 border-t-white" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50/70 rounded-lg px-3 py-2 flex flex-col gap-1 text-xs font-semibold text-gray-700">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-gray-900">{start.time}</span>
                <span className="text-gray-400">→</span>
                <span className="font-bold text-gray-900">{end.time}</span>
              </div>
            </div>
          </div>

          {start.date !== end.date && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 border-t border-gray-100 pt-1 mt-0.5">
              <span>Ends:</span>
              <span className="text-[#FF512F] font-bold bg-[#FF512F]/5 px-2 py-0.5 rounded-full shrink-0">
                {end.date}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Action Controls on Active / Wrapping Up Windows */}
      {w.id && (normalizedStatus === "Open" || normalizedStatus === "wrapping_up" || normalizedStatus === "Paused") && isAdmin && (
        <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 mt-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">Extend:</span>
            <div className="flex items-center rounded-lg bg-orange-50 border border-orange-200/60 p-0.5 min-w-0">
              {[15, 30, 60, 120].map((mins, index, array) => {
                const isThisLoading = quickActionLoading === `extend-${mins}`;
                const isAnyLoading = !!quickActionLoading || isSaving;
                return (
                  <React.Fragment key={mins}>
                    <button
                      type="button"
                      disabled={isAnyLoading}
                      onClick={async () => {
                        setQuickActionLoading(`extend-${mins}`);
                        try {
                          await onExtendWindow?.(w.id!, mins);
                        } finally {
                          setQuickActionLoading(null);
                        }
                      }}
                      className="px-1.5 py-1 rounded-md hover:bg-orange-200/50 text-[#FF512F] text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50 touch-manipulation min-h-[24px] whitespace-nowrap"
                    >
                      {isThisLoading ? (
                        <Spinner className="w-3 h-3 border-2 border-[#FF512F]/30 border-t-[#FF512F]" />
                      ) : (
                        `+${mins >= 60 ? `${mins / 60}h` : `${mins}m`}`
                      )}
                    </button>
                    {index < array.length - 1 && (
                      <div className="w-[1px] h-3 bg-orange-200/70 mx-0.5 shrink-0 rounded-full" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!!quickActionLoading || isSaving}
            onClick={async () => {
              setQuickActionLoading('close-early');
              try {
                await onCloseEarlyWindow?.(w.id!);
              } finally {
                setQuickActionLoading(null);
              }
            }}
            className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 touch-manipulation min-h-[24px] shrink-0"
          >
            {quickActionLoading === 'close-early' ? (
              <Spinner className="w-3 h-3 border-2 border-red-600/30 border-t-red-600" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500" />
            )}
            Close Early
          </button>
        </div>
      )}
    </div>
  );
}
