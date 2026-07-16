import { Calendar, Clock, Trash2, Pause, Play } from "lucide-react";
import { QueueWindow } from "@/types/job";
import { formatWindowIso } from "@/common/utils/queueWindowDatetime";
import { hasQueueWindowEnded } from "../../utils/jobPublishValidation";
import { normalizeWindowStatus } from "../../utils/queueWindowLive";

interface QueueWindowCardProps {
  window: QueueWindow;
  index: number;
  disabled: boolean;
  isSaving: boolean;
  onDelete: (index: number) => void;
  /** Show pause + play on this card (active published job). */
  showLiveActions?: boolean;
  onPauseLive?: () => void;
  onResumeLive?: () => void;
}

export function QueueWindowCard({
  window: w,
  index,
  disabled,
  isSaving,
  onDelete,
  showLiveActions = false,
  onPauseLive,
  onResumeLive,
}: QueueWindowCardProps) {
  const isPast = hasQueueWindowEnded(w);
  const normalizedStatus = normalizeWindowStatus(w.status);
  const statusLabel = normalizedStatus.toUpperCase();
  const canPauseThis = normalizedStatus === "Open";
  const canResumeThis = normalizedStatus === "Paused";

  const liveActionClass =
    "h-8 w-8 flex items-center justify-center border rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed";

  const start = formatWindowIso(w.startTime);
  const end = formatWindowIso(w.endTime);

  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-3 shadow-sm transition-all space-y-2.5 ${isPast ? "opacity-60 grayscale" : "hover:border-[#FF512F]/30"
        }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${isPast ? "bg-gray-100 text-gray-400" : "bg-[#FFF5F2] text-[#FF512F]"
              }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{start.date}</span>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1 shrink-0">
            {showLiveActions && (
              <>
                {normalizedStatus === "Paused" ? (
                  <button
                    type="button"
                    onClick={onResumeLive}
                    disabled={isSaving || !canResumeThis}
                    className={`${liveActionClass} ${canResumeThis
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                      : "border-gray-100 bg-gray-50 text-gray-300"
                      }`}
                    title={
                      canResumeThis
                        ? "Open this window"
                        : "Open is available when this window is paused"
                    }
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPauseLive}
                    disabled={isSaving || !canPauseThis}
                    className={`${liveActionClass} ${canPauseThis
                      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer"
                      : "border-gray-100 bg-gray-50 text-gray-300"
                      }`}
                    title={
                      canPauseThis
                        ? "Pause this window"
                        : "Pause is available when this window is open"
                    }
                  >
                    <Pause className="w-3.5 h-3.5" />
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

      <div className="bg-gray-50/60 rounded-lg px-2.5 py-1.5 flex flex-col gap-1 text-xs font-semibold text-gray-600">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-gray-700">{start.time}</span>
              <span className="text-gray-400">→</span>
              <span className="font-bold text-gray-700">{end.time}</span>
            </div>
          </div>

          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider shrink-0 ${normalizedStatus === "Open"
              ? "bg-green-100 text-green-700 animate-pulse"
              : normalizedStatus === "Paused"
                ? "bg-amber-100 text-amber-700"
                : isPast
                  ? "bg-gray-200 text-gray-600"
                  : "bg-blue-50 text-blue-600"
              }`}
          >
            {isPast ? "COMPLETED" : statusLabel}
          </span>
        </div>

        {start.date !== end.date && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 border-t border-gray-100/60 pt-1.5 mt-0.5">
            <span>Ends:</span>
            <span className="text-[#FF512F] font-bold bg-[#FF512F]/5 px-2 py-0.5 rounded-full shrink-0">
              {end.date}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
