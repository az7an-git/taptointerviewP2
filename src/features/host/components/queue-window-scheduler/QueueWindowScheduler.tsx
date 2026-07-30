import React from "react";
import { QueueWindow, QueueWindowStatus } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { Plus, AlertCircle, Clock, Bell } from "lucide-react";
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
import { CloseDecisionModal } from "../queue/CloseDecisionModal";
import { WindowRequestsInboxModal } from "../queue/WindowRequestsInboxModal";
import { WindowRequest } from "@/types/job";
import { useJobRealtime } from "@/hooks/useJobRealtime";

const formatWindowStatusError = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { data?: unknown; message?: unknown } } };
  const msg = err?.response?.data?.data ?? err?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  return fallback;
};

interface Props {
  jobId: string;
  job?: any;
  initialWindows?: QueueWindow[];
  onWindowsChange?: (windows: QueueWindow[]) => void;
  /** When true, shows Save and calls PUT /jobs/:id/windows */
  persistToApi?: boolean;
  /** When true with persistToApi, shows pause/resume for the live window (PUT .../windows/status) */
  allowLiveControls?: boolean;
  disabled?: boolean;
  /** When false, hides the Schedule Window button (e.g. for interviewers). Defaults to true. */
  showAddButton?: boolean;
  isAdmin?: boolean;
  onJobUpdated?: (job: any) => void;
}

const applyTimeBasedTransitions = (ws: QueueWindow[]): { next: QueueWindow[]; changed: boolean } => {
  let changed = false;
  const now = Date.now();
  const next = ws.map((w) => {
    const startMs = windowIsoToMs(w.startTime);
    const endMs = windowIsoToMs(w.endTime);
    let newStatus = w.status;

    if (now < startMs) {
      newStatus = "Scheduled";
    } else if (w.status === "Scheduled" && now >= startMs && now < endMs) {
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
  job,
  initialWindows = [],
  onWindowsChange,
  persistToApi = false,
  allowLiveControls = false,
  disabled = false,
  showAddButton = true,
  isAdmin = true,
  onJobUpdated,
}: Props) {
  const sortDesc = (ws: QueueWindow[]) =>
    [...ws].sort((a, b) => windowIsoToMs(b.startTime) - windowIsoToMs(a.startTime));

  const [windows, setWindows] = React.useState<QueueWindow[]>(() => sortDesc(initialWindows));
  const isWrappingUp = job?.queueStatus === "wrapping_up" || job?.pendingCloseDecision || windows.some(w => w.status === "wrapping_up" || w.pendingCloseDecision);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUpdatingLiveStatus, setIsUpdatingLiveStatus] = React.useState(false);
  const [decisionWindowId, setDecisionWindowId] = React.useState<string | null>(null);
  const [decisionData, setDecisionData] = React.useState<{ waitingCount: number; activeInterviews: number } | null>(null);
  const [isSubmittingDecision, setIsSubmittingDecision] = React.useState(false);
  const addFormRef = React.useRef<HTMLDivElement>(null);

  const [pendingRequests, setPendingRequests] = React.useState<WindowRequest[]>([]);
  const [windowRequestsInboxOpen, setWindowRequestsInboxOpen] = React.useState(false);
  const [processingRequestId, setProcessingRequestId] = React.useState<string | null>(null);

  const fetchPendingRequests = React.useCallback(async () => {
    if (!isAdmin || !jobId || jobId === "new") return;
    try {
      const res = await jobsApi.listWindowRequests(jobId);
      const pending = (res.data || []).filter((r: WindowRequest) => r.status === "pending");
      setPendingRequests(pending);
    } catch {
      // Ignore
    }
  }, [jobId, isAdmin]);

  React.useEffect(() => {
    void fetchPendingRequests();
  }, [fetchPendingRequests]);

  useJobRealtime(jobId && jobId !== "new" ? jobId : undefined, () => { }, {
    onWindowRequestCreated: () => {
      if (isAdmin) {
        toast.info("New window request received from recruiter.");
        void fetchPendingRequests();
      }
    },
    onWindowRequestReviewed: () => {
      if (isAdmin) {
        void fetchPendingRequests();
      }
    }
  });

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

  const handleSingleWindowEdit = async (
    windowId: string,
    payload: { starts_at?: string; ends_at?: string }
  ) => {
    if (!jobId || jobId === "new") return;
    try {
      const response = await jobsApi.updateSingleWindow(jobId, windowId, payload);
      if (response.data?.job) {
        onJobUpdated?.(response.data.job);
        const updated = response.data.job.queueWindows || [];
        setWindows(updated);
        onWindowsChange?.(updated);
      }
      toast.success("Window schedule updated.");
    } catch (error: any) {
      console.error("Failed to edit window:", error);
      const msg = error?.response?.data?.data || error?.response?.data?.message || "Failed to update window schedule.";
      toast.error(typeof msg === "string" ? msg : "Failed to update window schedule.");
      throw error;
    }
  };

  const handleExtendWindow = async (windowId: string, minutes: number) => {
    if (!jobId || jobId === "new") return;
    try {
      const response = await jobsApi.extendWindow(jobId, windowId, minutes);
      if (response.data?.job) {
        onJobUpdated?.(response.data.job);
        const updated = response.data.job.queueWindows || [];
        setWindows(updated);
        onWindowsChange?.(updated);
      }
      toast.success(`Window extended by ${minutes} minutes.`);
    } catch (error: any) {
      console.error("Failed to extend window:", error);
      const msg = error?.response?.data?.data || error?.response?.data?.message || "Failed to extend window.";
      toast.error(typeof msg === "string" ? msg : "Failed to extend window.");
    }
  };

  const handleCloseEarlyWindow = async (windowId: string) => {
    if (!jobId || jobId === "new") return;
    try {
      const response = await jobsApi.closeWindowEarly(jobId, windowId);
      if (response.data?.job) {
        onJobUpdated?.(response.data.job);
        const updated = response.data.job.queueWindows || [];
        setWindows(updated);
        onWindowsChange?.(updated);
      }
      toast.success(response.data?.message || "Window closed early.");

      if (response.data?.pending_close_decision) {
        setDecisionWindowId(windowId);
        setDecisionData({
          waitingCount: response.data.waiting_count || 0,
          activeInterviews: response.data.active_interviews || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to close window early:", error);
      const msg = error?.response?.data?.data || error?.response?.data?.message || "Failed to close window early.";
      toast.error(typeof msg === "string" ? msg : "Failed to close window early.");
    }
  };

  const handleConfirmCloseDecision = async (decision: "continue" | "release") => {
    if (!jobId || !decisionWindowId) return;
    setIsSubmittingDecision(true);
    try {
      const res = await jobsApi.closeWindowDecision(jobId, decisionWindowId, decision);
      toast.success(res.data?.message || "Close decision recorded.");
      setDecisionWindowId(null);
      setDecisionData(null);
      if (res.data?.job) {
        onJobUpdated?.(res.data.job);
        const updated = res.data.job.queueWindows || [];
        setWindows(updated);
        onWindowsChange?.(updated);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.data || "Failed to submit close decision.");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleReviewRequest = async (
    requestId: string,
    action: "approve" | "decline",
    extendMinutesOverride?: number
  ) => {
    if (!jobId || jobId === "new") return;
    setProcessingRequestId(requestId);
    try {
      const response = await jobsApi.reviewWindowRequest(jobId, requestId, {
        action,
        extend_minutes: extendMinutesOverride,
      });
      toast.success(action === "approve" ? "Request approved!" : "Request declined.");
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (response.data?.job) {
        onJobUpdated?.(response.data.job);
        const updated = response.data.job.queueWindows || [];
        setWindows(updated);
        onWindowsChange?.(updated);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.data || "Failed to review request.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Queue Windows</h3>
          {isAdmin && pendingRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setWindowRequestsInboxOpen(true)}
              className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#FF512F] border border-orange-200 hover:bg-orange-200 transition-colors flex items-center gap-1 cursor-pointer animate-pulse"
            >
              <Bell className="w-3 h-3" />
              {pendingRequests.length} Request{pendingRequests.length === 1 ? "" : "s"}
            </button>
          )}
        </div>
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

      {isWrappingUp && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xs uppercase">Window Wrapping Up</span>
              {(job?.pendingCloseDecision || windows.some(w => w.pendingCloseDecision)) && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-200/90 text-amber-900 uppercase tracking-wider shrink-0 shadow-2xs">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-xs font-medium">
              Closed to new candidates. Ongoing interviews & waiting queue remain protected.
            </p>
            {isAdmin && (job?.pendingCloseDecision || windows.some(w => w.pendingCloseDecision)) && (
              <button
                type="button"
                onClick={() => {
                  const targetWindowId = windows.find(w => w.status === "wrapping_up")?.id || windows[0]?.id;
                  if (targetWindowId) {
                    setDecisionWindowId(targetWindowId);
                    setDecisionData({
                      waitingCount: job?.applicants?.filter((a: any) => a.queue_status === "waiting")?.length || 0,
                      activeInterviews: 0
                    });
                  }
                }}
                className="w-full sm:w-auto mt-3 px-4 py-2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:opacity-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm touch-manipulation flex items-center justify-center gap-1.5"
              >
                Decide Queue Action
              </button>
            )}
          </div>
        </div>
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
                isAdmin={isAdmin}
                onDelete={handleDeleteWindow}
                showLiveActions={showLiveControls}
                onPauseLive={() => handleLiveStatusChange("paused")}
                onResumeLive={() => handleLiveStatusChange("open")}
                onSingleWindowEdit={handleSingleWindowEdit}
                onExtendWindow={handleExtendWindow}
                onCloseEarlyWindow={handleCloseEarlyWindow}
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

      <CloseDecisionModal
        isOpen={!!decisionWindowId}
        waitingCount={decisionData?.waitingCount || 0}
        activeInterviews={decisionData?.activeInterviews || 0}
        onClose={() => {
          setDecisionWindowId(null);
          setDecisionData(null);
        }}
        onConfirmDecision={handleConfirmCloseDecision}
        isSubmitting={isSubmittingDecision}
      />

      <WindowRequestsInboxModal
        isOpen={windowRequestsInboxOpen}
        requests={pendingRequests}
        processingRequestId={processingRequestId}
        onClose={() => setWindowRequestsInboxOpen(false)}
        onReviewRequest={handleReviewRequest}
      />
    </div>
  );
}
