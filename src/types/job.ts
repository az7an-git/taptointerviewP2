export type JobStatus = "Draft" | "Active" | "Paused" | "Closed";

export interface ScreeningQuestionOption {
  text: string;
  isDealBreaker: boolean;
  sortOrder?: number;
}

export interface ScreeningQuestion {
  id?: string;
  text: string;
  sortOrder?: number;
  complianceStatus?: string;
  complianceNotes?: string | null;
  options: ScreeningQuestionOption[];
}

export type QueueWindowStatus = "Scheduled" | "Open" | "Closed" | "Paused";

/** Body for PUT /jobs/:jobId/windows/status */
export type QueueWindowLiveStatusPayload = "open" | "paused";

export interface QueueWindow {
  id?: string;
  startTime: string; // UTC ISO (Z), maps to starts_at
  endTime: string; // UTC ISO (Z), maps to ends_at
  status?: QueueWindowStatus;
}

export interface JobReview {
  ready: boolean;
  jobStatus: string;
  title: string;
  screeningQuestions: number;
  dealBreakerAnswers: number;
  interviewWindows: number;
  creditsRequired: string;
  canPublish: boolean;
  publishErrors: string[];
}

export interface ComplianceReviewResult {
  jobId: string;
  reviewedCount: number;
  reviewedWithClaudeCount: number;
  skippedApprovedCount: number;
  screeningQuestions: ScreeningQuestion[];
}

export interface JobParticipant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export type QueueEntryStatus =
  | "waiting"
  | "called"
  | "admitted"
  | "confirmed"
  | "in_session"
  | "pending_outcome"
  | "resolved"
  | "removed"
  | "declined";

export type QueueEntryOutcome = "hired" | "follow_up" | "not_a_fit";

export interface ScreeningAnswer {
  questionId: string;
  question: string;
  sortOrder: number;
  selectedOptionIndex: number;
  selectedOptionText: string;
}

export interface JobApplicant {
  queueEntryId: string;
  status: string;
  joinedAt: string | null;
  calledAt: string | null;
  admissionExpiresAt: string | null;
  sessionStartedAt: string | null;
  sessionEndedAt: string | null;
  sessionDurationSeconds: number | null;
  outcome: QueueEntryOutcome | null;
  rating: number | null;
  internalNotes: string | null;
  screeningAnswers: ScreeningAnswer[];
  roomUrl?: string;
  hostToken?: string;
  createdAt: string;
  updatedAt: string;
  participant: JobParticipant;
}

export interface SaveOutcomePayload {
  outcome: QueueEntryOutcome;
  rating?: number | null;
  internal_notes?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  department: string;
  requirements: string;
  salaryMin: number;
  salaryMax: number;
  status: JobStatus;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  screeningQuestions?: ScreeningQuestion[];
  queueWindows?: QueueWindow[];
  queueCount?: number;
  totalCount?: number;
  applicants?: JobApplicant[];
  /** From active_queues API when window list is not included */
  queuePauseStatus?: string;
}
