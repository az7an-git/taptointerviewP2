import React from "react";
import { QueueWindow, QueueWindowStatus } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  hasFutureQueueWindow,
  isFutureQueueWindow,
  QUEUE_WINDOW_MESSAGES,
  showValidationToast,
} from "../../utils/jobPublishValidation";
import { buildWindowRange, windowIsoToMs } from "@/common/utils/queueWindowDatetime";
import { QueueWindowCard } from "./QueueWindowCard";
import { AddWindowForm, type LocalWindowInput } from "./AddWindowForm";

const formatWindowStatusError = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { data?: unknown; message?: unknown } } };
  const msg = err?.response?.data?.data ?? err?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  return fallback;
};

interface Props {
  jobId: string;
  initialWindows?: QueueWindow[];
  onWindowsChange?: (windows: QueueWindow[]) => void;
  /** When true, shows Save and calls PUT /jobs/:id/windows */
  persistToApi?: boolean;
  /** When true with persistToApi, shows pause/resume for the live window (PUT .../windows/status) */
  allowLiveControls?: boolean;
  disabled?: boolean;
  /** When false, hides the Schedule Window button (e.g. for interviewers). Defaults to true. */
  showAddButton?: boolean;
}

const applyTimeBasedTransitions = (ws: QueueWindow[]): { next: QueueWindow[]; changed: boolean } => {
  let changed = false;
  const now = Date.now();
  const next = ws.map((w) => {
    const startMs = windowIsoToMs(w.startTime);
    const endMs = windowIsoToMs(w.endTime);
    let newStatus = w.status;

    if (w.status === "Scheduled" && now >= startMs && now < endMs) {
      newStatus = "Open";
    } else if ((w.status === "Open" || w.status === "Paused" || w.status === "Scheduled") && now >= endMs) {
      newStatus = "Closed";
    }

    if (newStatus !== w.status) {
      changed = true;
      return { ...w, status: newStatus as QueueWindowStatus };
    }
    return w;
  });
  return { next, changed };
};

export default function QueueWindowScheduler({
  jobId,
  initialWindows = [],
  onWindowsChange,
  persistToApi = false,
  allowLiveControls = false,
  disabled = false,
  showAddButton = true,
}: Props) {
  const sortDesc = (ws: QueueWindow[]) =>
    [...ws].sort((a, b) => windowIsoToMs(b.startTime) - windowIsoToMs(a.startTime));

  const [windows, setWindows] = React.useState<QueueWindow[]>(() => sortDesc(initialWindows));
  const [isAdding, setIsAdding] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUpdatingLiveStatus, setIsUpdatingLiveStatus] = React.useState(false);
  const addFormRef = React.useRef<HTMLDivElement>(null);

  // Use a ref to access the latest onWindowsChange inside timers
  const onWindowsChangeRef = React.useRef(onWindowsChange);
  React.useEffect(() => {
    onWindowsChangeRef.current = onWindowsChange;
  }, [onWindowsChange]);

  React.useEffect(() => {
    const { next, changed } = applyTimeBasedTransitions(initialWindows);
    setWindows(sortDesc(next));
    if (changed) {
      // Defer state update to avoid rendering issues during mount
      setTimeout(() => {
        onWindowsChangeRef.current?.(next);
      }, 0);
    }
  }, [initialWindows]);

  // Client-side real-time status transitions — no API calls needed.
  // Registers a timer for each window's start (Scheduled → Open) and end (Open/Paused → Closed).
  // Capped at 30-min lookahead; timers are cleaned up on unmount or when windows change.
  const MAX_LOOKAHEAD_MS = 30 * 60 * 1000;
  React.useEffect(() => {
    const timerIds: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();

    windows.forEach((w) => {
      const startMs = windowIsoToMs(w.startTime);
      const endMs = windowIsoToMs(w.endTime);

      // Scheduled → Open when startTime is reached
      if (w.status === "Scheduled") {
        const msUntilStart = startMs - now;
        if (msUntilStart > 0 && msUntilStart < MAX_LOOKAHEAD_MS) {
          timerIds.push(
            setTimeout(() => {
              setWindows((curr) => {
                const updated = curr.map((cw) =>
                  cw.id === w.id || (cw.startTime === w.startTime && cw.endTime === w.endTime)
                    ? { ...cw, status: "Open" as QueueWindowStatus }
                    : cw
                );
                setTimeout(() => onWindowsChangeRef.current?.(updated), 0);
                return updated;
              });
            }, msUntilStart)
          );
        }
      }

      // Open / Paused → Closed when endTime is reached
      if (w.status === "Open" || w.status === "Paused") {
        const msUntilEnd = endMs - now;
        if (msUntilEnd > 0 && msUntilEnd < MAX_LOOKAHEAD_MS) {
          timerIds.push(
            setTimeout(() => {
              setWindows((curr) => {
                const updated = curr.map((cw) =>
                  cw.id === w.id || (cw.startTime === w.startTime && cw.endTime === w.endTime)
                    ? { ...cw, status: "Closed" as QueueWindowStatus }
                    : cw
                );
                setTimeout(() => onWindowsChangeRef.current?.(updated), 0);
                return updated;
              });
            }, msUntilEnd)
          );
        }
      }
    });

    return () => timerIds.forEach(clearTimeout);
  }, [windows.map((w) => `${w.id ?? w.startTime}:${w.status}`).join(",")]);

  const updateWindows = (updated: QueueWindow[]) => {
    setWindows(updated);
    onWindowsChange?.(updated);
  };

  const handleSaveToApi = async (windowsToSave: QueueWindow[]) => {
    if (!jobId || jobId === "new") {
      toast.error("Save the job details first before scheduling queue windows.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await jobsApi.saveQueueWindows(jobId, windowsToSave);
      const saved = response.data.queueWindows || [];
      setWindows(saved);
      onWindowsChange?.(saved);
      toast.success("Queue windows saved.");
    } catch (error) {
      console.error("Failed to save queue windows:", error);
      toast.error("Failed to save queue windows.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWindow = async (input: LocalWindowInput) => {
    const { startDate, startTime, endDate, endTime } = input;

    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error("All date and time fields are required");
      return;
    }

    const { startTime: startIso, endTime: endIso } = buildWindowRange(input);
    const startMs = windowIsoToMs(startIso);
    const endMs = windowIsoToMs(endIso);

    if (endMs <= startMs) {
      toast.error("End time must be after start time");
      return;
    }

    const now = Date.now();
    if (startMs <= now) {
      showValidationToast("Invalid window", QUEUE_WINDOW_MESSAGES.windowStartMustBeFuture);
      return;
    }
    if (endMs <= now) {
      showValidationToast("Invalid window", QUEUE_WINDOW_MESSAGES.windowEndMustBeFuture);
      return;
    }

    const newWindow: QueueWindow = {
      startTime: startIso,
      endTime: endIso,
      status: "Scheduled",
    };

    const hasExactDuplicate = windows.some((w) => windowIsoToMs(w.startTime) === startMs);
    if (hasExactDuplicate) {
      toast.error("A queue window starting at this exact time already exists.");
      return;
    }

    // 2. Check for overlapping time windows
    const hasOverlap = windows.some((w) => {
      const existingStart = windowIsoToMs(w.startTime);
      const existingEnd = windowIsoToMs(w.endTime);
      return startMs < existingEnd && endMs > existingStart;
    });
    if (hasOverlap) {
      toast.error("This window overlaps with an already scheduled queue window.");
      return;
    }

    const updatedWindows = [...windows, newWindow].sort(
      (a, b) => windowIsoToMs(b.startTime) - windowIsoToMs(a.startTime)
    );
    updateWindows(updatedWindows);
    setIsAdding(false);

    if (persistToApi) {
      await handleSaveToApi(updatedWindows);
    } else {
      toast.success("Window scheduled");
    }
  };

  const handleDeleteWindow = async (index: number) => {
    const updatedWindows = windows.filter((_, i) => i !== index);
    updateWindows(updatedWindows);

    if (persistToApi && jobId !== "new") {
      await handleSaveToApi(updatedWindows);
    } else {
      toast.success("Window removed");
    }
  };

  const hasFutureWindow = hasFutureQueueWindow(windows);
  const futureWindowCount = windows.filter((w) => isFutureQueueWindow(w)).length;
  const showLiveControls = persistToApi && allowLiveControls && !disabled && jobId !== "new";
  const liveControlsBusy = isSaving || isUpdatingLiveStatus;

  const handleLiveStatusChange = async (status: "open" | "paused") => {
    if (!jobId || jobId === "new") return;

    setIsUpdatingLiveStatus(true);
    try {
      const response = await jobsApi.updateQueueWindowStatus(jobId, status);
      const saved = response.data.queueWindows || [];
      setWindows(saved);
      onWindowsChange?.(saved);
      toast.success(status === "paused" ? "Queue paused." : "Queue resumed.");
    } catch (error) {
      console.error("Failed to update queue window status:", error);
      toast.error(
        formatWindowStatusError(
          error,
          status === "paused"
            ? "No open queue window to pause."
            : "No paused queue window to resume."
        )
      );
    } finally {
      setIsUpdatingLiveStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Queue Windows</h3>
        {!disabled && showAddButton && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
              }}
              disabled={liveControlsBusy}
              className="bg-[#FF512F]/10 text-[#FF512F] hover:bg-[#FF512F] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer w-fit shadow-sm shadow-[#FF512F]/5 active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Schedule Window
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Jobs need at least one window whose{" "}
        <span className="font-bold text-gray-700">start and end are both in the future</span>.
      </p>

      {windows.length > 0 && !hasFutureWindow && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs font-medium">
            None of your scheduled windows are fully in the future. Add a new window with future start and end times.
          </p>
        </div>
      )}

      {hasFutureWindow && (
        <p
          className="text-xs font-semibold text-green-700 leading-loose pt-2 pb-1 block overflow-visible"
          style={{ overflow: "visible" }}
        >
          {futureWindowCount} future window{futureWindowCount === 1 ? "" : "s"} scheduled, ready for publish.
        </p>
      )}

      <div className="space-y-3">
        {isAdding && (
          <div ref={addFormRef}>
            <AddWindowForm
              isSaving={isSaving}
              onCancel={() => setIsAdding(false)}
              onSchedule={handleAddWindow}
            />
          </div>
        )}

        {windows.length > 0 && (
          <div className="space-y-3">
            {windows.map((w, index) => (
              <QueueWindowCard
                key={w.id ?? `window-${index}`}
                window={w}
                index={index}
                disabled={disabled || !showAddButton}
                isSaving={isSaving || isUpdatingLiveStatus}
                onDelete={handleDeleteWindow}
                showLiveActions={showLiveControls}
                onPauseLive={() => handleLiveStatusChange("paused")}
                onResumeLive={() => handleLiveStatusChange("open")}
              />
            ))}
          </div>
        )}

        {windows.length === 0 && !isAdding && (
          <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
            <p className="text-xs text-gray-400 font-medium italic">No queue windows scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
