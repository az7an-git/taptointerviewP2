import { Job } from "@/types/job";
import {
  hasFutureQueueWindow,
  hasScreeningQuestions,
} from "./jobPublishValidation";

const STORAGE_KEY = "post_job_wizard";

export function isDraftJob(status?: string): boolean {
  return status?.toLowerCase() === "draft";
}

export function getJobDetailHref(basePath: string, job: Pick<Job, "id" | "status">): string {
  if (isDraftJob(job.status)) {
    return `${basePath}/jobs/post?draft=${job.id}`;
  }
  return `${basePath}/jobs/${job.id}`;
}

/** Pass as Link state so /jobs/post always opens a blank wizard (not a prior in-progress draft). */
export const POST_JOB_NEW_INTENT = { newJob: true as const };

export function getPostNewJobHref(basePath: string): string {
  return `${basePath}/jobs/post`;
}

/** First wizard step that still needs work before publish. */
export function getWizardResumeStep(job: Partial<Job>): number {
  if (!job.id) return 1;
  if (!hasScreeningQuestions(job.screeningQuestions)) return 2;
  if (!hasFutureQueueWindow(job.queueWindows)) return 3;
  return 4;
}

export interface PostJobWizardState {
  currentStep: number;
  jobData: Partial<Job>;
}

export const postJobWizardStorage = {
  load(): PostJobWizardState | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PostJobWizardState;
    } catch {
      return null;
    }
  },

  save(state: PostJobWizardState): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};
