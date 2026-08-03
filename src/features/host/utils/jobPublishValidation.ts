import { toast } from "sonner";
import { JobReview, QueueWindow, ScreeningQuestion } from "@/types/job";
import { windowIsoToMs } from "@/common/utils/queueWindowDatetime";

export const QUEUE_WINDOW_MESSAGES = {
  addFutureRequired:
    "Add at least one queue window with start and end times in the future, then continue.",
  allWindowsInvalid:
    "No valid future windows. Schedule a new window with start and end times still in the future.",
  windowStartMustBeFuture:
    "The window start date and time must be in the future.",
  windowEndMustBeFuture:
    "The window end date and time must be in the future.",
} as const;

export const SCREENING_MESSAGES = {
  required: "Add at least one qualification question before continuing.",
} as const;

export function todayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Default start/end one hour apart, beginning at the next whole hour from now. */
export function getDefaultFutureWindowTimes(now: Date = new Date()) {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    startDate: todayDateString(start),
    startTime: formatTimeHHMM(start),
    endDate: todayDateString(end),
    endTime: formatTimeHHMM(end),
  };
}

/** A queue window counts as valid when its end is still in the future,
 *  OR when it is currently Open/Paused (actively running). */
export function isFutureQueueWindow(window: QueueWindow, now: Date = new Date()): boolean {
  // Actively-running windows are always valid regardless of start time
  const status = window.status?.toLowerCase();
  if (status === "open" || status === "paused" || status === "wrapping_up") return true;

  const startMs = windowIsoToMs(window.startTime);
  const endMs = windowIsoToMs(window.endTime);
  return (
    !Number.isNaN(startMs) &&
    !Number.isNaN(endMs) &&
    endMs > now.getTime()
  );
}

/** True once the window's end time has passed (for display, not publish checks). */
export function hasQueueWindowEnded(window: QueueWindow, now: Date = new Date()): boolean {
  const status = window.status?.toLowerCase();
  if (status === "wrapping_up") return false;
  const endMs = windowIsoToMs(window.endTime);
  return !Number.isNaN(endMs) && endMs <= now.getTime();
}

export function hasFutureQueueWindow(
  windows?: QueueWindow[],
  now: Date = new Date()
): boolean {
  return windows?.some((w) => isFutureQueueWindow(w, now)) ?? false;
}

export function hasScreeningQuestions(questions?: ScreeningQuestion[]): boolean {
  return (questions?.length ?? 0) > 0;
}

export interface JobPublishValidationResult {
  canPublish: boolean;
  hasQuestions: boolean;
  hasFutureWindow: boolean;
  errors: string[];
}

export function validateJobCanPublish(job: {
  screeningQuestions?: ScreeningQuestion[];
  queueWindows?: QueueWindow[];
}): JobPublishValidationResult {
  const hasQuestions = hasScreeningQuestions(job.screeningQuestions);
  const hasFutureWindow = hasFutureQueueWindow(job.queueWindows);
  const errors: string[] = [];

  if (!hasQuestions) {
    errors.push("At least one qualification question is required");
  }
  if (!hasFutureWindow) {
    errors.push("At least one queue window must start and end in the future");
  }

  return {
    canPublish: hasQuestions && hasFutureWindow,
    hasQuestions,
    hasFutureWindow,
    errors,
  };
}

export function publishValidationErrorMessage(result: JobPublishValidationResult): string {
  return result.errors.join(". ");
}

export function getQueueWindowStepError(windows: QueueWindow[]): string | null {
  if (hasFutureQueueWindow(windows)) return null;
  if (windows.length === 0) return QUEUE_WINDOW_MESSAGES.addFutureRequired;
  return QUEUE_WINDOW_MESSAGES.allWindowsInvalid;
}

/** Sonner toast with title + description so the message is readable on mobile. */
export function showValidationToast(title: string, description?: string) {
  toast.error(title, {
    description: description ?? undefined,
    duration: 5000,
  });
}

export function showQueueWindowStepToast(windows: QueueWindow[]) {
  const message = getQueueWindowStepError(windows);
  if (!message) return;
  showValidationToast("Queue window required", message);
}

export function showPublishBlockedToast(result: JobPublishValidationResult) {
  showValidationToast(
    "Cannot publish yet",
    result.errors.join(" ")
  );
}

export function getCriticalPublishErrors(review: JobReview): string[] {
  return review.publishErrors.filter(err => {
    const lower = err.toLowerCase();
    return !lower.includes('caution') && !lower.includes('flagged') && !lower.includes('warning');
  });
}

/** Backend may set can_publish to false and return publish_errors — we override this and allow publish if errors are only non-critical warnings (like caution). */
export function canPublishFromReview(review: JobReview): boolean {
  return getCriticalPublishErrors(review).length === 0;
}

export function showReviewBlockedToast(review: JobReview) {
  const message =
    review.publishErrors.length > 0
      ? review.publishErrors.join(" ")
      : "This job is not ready to publish yet.";
  showValidationToast("Cannot publish yet", message);
}
