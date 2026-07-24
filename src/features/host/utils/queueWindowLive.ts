import { windowIsoToMs } from "@/common/utils/queueWindowDatetime";
import { QueueWindow, QueueWindowStatus } from "@/types/job";

export function isWindowInLiveSlot(window: QueueWindow, now: Date = new Date()): boolean {
  const start = windowIsoToMs(window.startTime);
  const end = windowIsoToMs(window.endTime);
  const t = now.getTime();
  return !Number.isNaN(start) && !Number.isNaN(end) && t >= start && t < end;
}

export function normalizeWindowStatus(status?: string): QueueWindowStatus {
  const s = (status ?? "Scheduled").toLowerCase();
  if (s === "open") return "Open";
  if (s === "wrapping_up") return "wrapping_up";
  if (s === "paused") return "Paused";
  if (s === "closed") return "Closed";
  return "Scheduled";
}

export function hasWindowWithStatus(
  windows: QueueWindow[],
  status: QueueWindowStatus
): boolean {
  return windows.some((w) => normalizeWindowStatus(w.status) === status);
}

export function findLiveWindow(
  windows: QueueWindow[],
  status: QueueWindowStatus,
  now: Date = new Date()
): QueueWindow | undefined {
  return windows.find(
    (w) => normalizeWindowStatus(w.status) === status && isWindowInLiveSlot(w, now)
  );
}

export function canPauseLiveWindow(windows: QueueWindow[], now: Date = new Date()): boolean {
  return !!findLiveWindow(windows, "Open", now);
}

export function canResumeLiveWindow(windows: QueueWindow[], now: Date = new Date()): boolean {
  return !!findLiveWindow(windows, "Paused", now);
}

export function isActiveJobStatus(status: string): boolean {
  return status.toLowerCase() === "active";
}

export function canShowResumeControl(windows: QueueWindow[]): boolean {
  return hasWindowWithStatus(windows, "Paused");
}

export function canShowPauseControl(windows: QueueWindow[]): boolean {
  return hasWindowWithStatus(windows, "Open");
}

export type LiveQueueState = "open" | "wrapping_up" | "paused" | "inactive";

export function getLiveQueueState(windows: QueueWindow[], now: Date = new Date()): LiveQueueState {
  if (hasWindowWithStatus(windows, "wrapping_up")) return "wrapping_up";
  if (canPauseLiveWindow(windows, now)) return "open";
  if (canResumeLiveWindow(windows, now)) return "paused";
  return "inactive";
}
