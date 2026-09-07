import type { JobApplicant, QueueEntryOutcome, QueueEntryStatus } from "@/types/job";

/** Statuses that block admit-next until the current participant is fully resolved. */
export const ADMIT_NEXT_BLOCKING_STATUSES: QueueEntryStatus[] = [
  "called",
  "admitted",
  "confirmed",
  "in_session",
  "pending_outcome",
];

/** Participant is in the room — host must run start → end → outcome. */
export const SESSION_FLOW_STATUSES: QueueEntryStatus[] = [
  "admitted",
  "confirmed",
  "in_session",
  "pending_outcome",
];

export const QUEUE_OUTCOME_LABELS: Record<
  QueueEntryOutcome,
  { label: string; description: string }
> = {
  hired: {
    label: "Hired",
    description: "Moving forward with this candidate",
  },
  follow_up: {
    label: "Follow-Up",
    description: "Need more time before deciding",
  },
  not_a_fit: {
    label: "Not a Fit",
    description: "Not moving forward with this candidate",
  },
};

export function normalizeQueueStatus(status: string): QueueEntryStatus {
  return status.toLowerCase() as QueueEntryStatus;
}

export function blocksAdmitNext(status: string): boolean {
  return ADMIT_NEXT_BLOCKING_STATUSES.includes(normalizeQueueStatus(status));
}

export function hasActiveSessionFlow(applicants: JobApplicant[] | undefined): boolean {
  return (applicants ?? []).some((a) =>
    SESSION_FLOW_STATUSES.includes(normalizeQueueStatus(a.status))
  );
}

export function findSessionCandidate(
  applicants: JobApplicant[] | undefined,
  currentUserId?: string
): JobApplicant | undefined {
  if (!applicants) return undefined;
  if (currentUserId) {
    const hostCandidate = applicants.find(
      (a) =>
        SESSION_FLOW_STATUSES.includes(normalizeQueueStatus(a.status)) &&
        (a.isHost === true || a.interviewerId === currentUserId)
    );
    if (hostCandidate) return hostCandidate;
  }
  return (
    applicants.find(
      (a) =>
        SESSION_FLOW_STATUSES.includes(normalizeQueueStatus(a.status)) &&
        (a.isHost === true || a.interviewInProgress === true || a.participant === null)
    ) ||
    applicants.find((a) => SESSION_FLOW_STATUSES.includes(normalizeQueueStatus(a.status)))
  );
}

export function queueStatusSortWeight(status: string): number {
  switch (normalizeQueueStatus(status)) {
    case "called":
      return 1;
    case "in_session":
      return 2;
    case "pending_outcome":
      return 3;
    case "admitted":
    case "confirmed":
      return 4;
    case "waiting":
      return 5;
    case "resolved":
      return 6;
    case "removed":
      return 7;
    default:
      return 8;
  }
}

export function getApplicantSessionDuration(candidate: JobApplicant): number | null {
  if (candidate.sessionDurationSeconds !== null && candidate.sessionDurationSeconds !== undefined && candidate.sessionDurationSeconds >= 0) {
    return candidate.sessionDurationSeconds;
  }
  if (candidate.sessionStartedAt && candidate.sessionEndedAt) {
    const start = new Date(candidate.sessionStartedAt).getTime();
    const end = new Date(candidate.sessionEndedAt).getTime();
    if (!isNaN(start) && !isNaN(end)) {
      return Math.max(0, Math.floor((end - start) / 1000));
    }
  }
  return null;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/** Outcome + duration for resolved rows, or duration alone after session end. */
export function getSessionDetailLabel(candidate: JobApplicant): string | null {
  const status = normalizeQueueStatus(candidate.status);
  const duration = formatDuration(getApplicantSessionDuration(candidate));
  if (duration === "—") return null;

  if (status === "resolved" && candidate.outcome) {
    return duration;
  }
  if (status === "pending_outcome") {
    return `Ended · ${duration}`;
  }
  return null;
}

export function getParticipantDisplayName(
  participant?: { firstName?: string; lastName?: string } | null,
  fallback: string = "Candidate"
): string {
  if (!participant) return fallback;
  const firstName = participant?.firstName ?? "";
  const lastName = participant?.lastName ?? "";
  return `${firstName} ${lastName}`.trim() || fallback;
}

export function getAdmitNextShortName(
  participant?: { firstName?: string; lastName?: string } | null
): string {
  if (!participant) return "";
  const firstName = participant?.firstName ?? "";
  const lastInitial = participant?.lastName?.charAt(0);
  if (!firstName && !lastInitial) return "";
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

export function getParticipantInitials(
  participant?: { firstName?: string; lastName?: string } | null,
  fallback: string = "C"
): string {
  if (!participant) return fallback;
  const first = participant?.firstName?.[0]?.toUpperCase() || "?";
  const last = participant?.lastName?.[0]?.toUpperCase() || "";
  return `${first}${last}`.trim() || fallback;
}

export function formatJoinedTime(joinedAt: string | null): string {
  if (!joinedAt) return "Unknown";
  return new Date(joinedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mergeApplicantUpdate(
  applicants: JobApplicant[] | undefined,
  updated: JobApplicant | null,
  queueEntryId?: string,
  patch?: Partial<JobApplicant>
): JobApplicant[] {
  const list = applicants ?? [];
  if (updated) {
    return list.map((app) => {
      if (app.queueEntryId !== updated.queueEntryId) return app;
      const mergedParticipant = updated.participant ?? app.participant;
      return {
        ...app,
        ...updated,
        participant: mergedParticipant,
      };
    });
  }
  if (queueEntryId && patch) {
    return list.map((app) =>
      app.queueEntryId === queueEntryId ? { ...app, ...patch } : app
    );
  }
  return list;
}
