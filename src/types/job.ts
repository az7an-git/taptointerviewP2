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

export type QueueWindowStatus = "Scheduled" | "Open" | "Closed" | "Paused" | "Wrapping_up" | "wrapping_up";

/** Body for PUT /jobs/:jobId/windows/status */
export type QueueWindowLiveStatusPayload = "open" | "paused";

export interface QueueWindow {
  id?: string;
  startTime: string; // UTC ISO (Z), maps to starts_at
  endTime: string; // UTC ISO (Z), maps to ends_at
  status?: QueueWindowStatus;
  pendingCloseDecision?: boolean;
  closingWarningSentAt?: string | null;
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
  queueStatus?: "open" | "wrapping_up" | "paused" | "scheduled" | "closed" | string;
  pendingCloseDecision?: boolean;
}

export type WindowRequestType = "extend" | "early_close";
export type WindowRequestStatus = "pending" | "approved" | "declined";

export interface WindowRequestUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface WindowRequest {
  id: string;
  job_id: string;
  window_id: string;
  request_type: WindowRequestType;
  extend_minutes?: number | null;
  note?: string | null;
  status: WindowRequestStatus;
  requested_by?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string;
  requester?: WindowRequestUser;
  reviewer?: WindowRequestUser;
}

export interface WindowClosingWarningPayload {
  job_id: string;
  window_id: string;
  ends_at: string;
  waiting_count: number;
  minutes_remaining: number;
  message: string;
  at: string;
}

export interface WindowClosePromptPayload {
  job_id: string;
  window_id: string;
  waiting_count: number;
  active_interviews: number;
  pending_close_decision: boolean;
  has_future_window: boolean;
  options: ("continue" | "release")[];
  message: string;
  at: string;
}

export interface WindowRequestCreatedPayload {
  request: WindowRequest;
  job_id: string;
  at: string;
}

export interface WindowRequestReviewedPayload {
  request: WindowRequest;
  action: "approve" | "declined" | "decline";
  job_id: string;
  at: string;
}
