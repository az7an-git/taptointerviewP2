import { Check, X, AlertCircle, MapPin, Briefcase, DollarSign, FileText, Calendar } from "lucide-react";
import { GradientLoadingButton } from "@/common/ui/GradientLoadingButton";
import { StepLoadingState } from "@/common/ui/StepLoadingState";
import { Job, JobReview, QueueWindow, ScreeningQuestion } from "@/types/job";
import { canPublishFromReview } from "../../utils/jobPublishValidation";
import { getComplianceReviewState } from "../../utils/compliance";

function isDraftJobStatus(status: string): boolean {
  return status.trim().toLowerCase() === "draft";
}

interface JobPublishReviewProps {
  review: JobReview | null;
  screeningQuestions?: ScreeningQuestion[];
  jobData?: Partial<Job>;
  isLoadingReview: boolean;
  isPublishing: boolean;
  publishingMessage?: string | null;
  onBack: () => void;
  onPublish: () => void;
  onRetry?: () => void;
}

function RequirementRow({
  met,
  label,
  detail,
  variant = "default",
}: {
  met: boolean;
  label: string;
  detail: string;
  variant?: "default" | "warning";
}) {
  const isWarning = variant === "warning" && met;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border text-left ${isWarning
        ? "bg-amber-50/80 border-amber-100"
        : met
          ? "bg-green-50/80 border-green-100"
          : "bg-red-50/80 border-red-100"
        }`}
    >
      <div
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isWarning
          ? "bg-amber-500 text-white"
          : met
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
          }`}
      >
        {isWarning ? (
          <AlertCircle className="w-3 h-3" />
        ) : met ? (
          <Check className="w-3 h-3" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`text-xs font-bold ${isWarning ? "text-amber-800" : met ? "text-green-800" : "text-red-800"
            }`}
        >
          {label}
        </p>
        <p
          className={`text-[11px] mt-0.5 ${isWarning ? "text-amber-700" : met ? "text-green-700" : "text-red-700"
            }`}
        >
          {detail}
        </p>
      </div>
    </div>
  );
}

type ReviewStatTone = "neutral" | "slate" | "green" | "amber" | "red";

function ReviewStatCard({
  label,
  value,
  valueSize = "lg",
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  valueSize?: "lg" | "sm";
  tone?: ReviewStatTone;
}) {
  const valueClass =
    valueSize === "sm"
      ? "text-xs font-bold text-gray-800 leading-snug"
      : tone === "slate"
        ? "text-lg font-bold text-slate-800"
        : tone === "green"
          ? "text-lg font-bold text-green-800"
          : tone === "amber"
            ? "text-lg font-bold text-amber-800"
            : tone === "red"
              ? "text-lg font-bold text-red-800"
              : "text-lg font-bold text-gray-900";

  const borderClass =
    tone === "slate"
      ? "border-slate-200"
      : tone === "green"
        ? "border-green-100"
        : tone === "amber"
          ? "border-amber-100"
          : tone === "red"
            ? "border-red-100"
            : "border-gray-100";

  const bgClass =
    tone === "slate"
      ? "bg-slate-50"
      : tone === "green"
        ? "bg-green-50"
        : tone === "amber"
          ? "bg-amber-50"
          : tone === "red"
            ? "bg-red-50"
            : "bg-gray-50";

  const labelClass =
    tone === "slate"
      ? "text-slate-500"
      : tone === "green"
        ? "text-green-600"
        : tone === "amber"
          ? "text-amber-600"
          : tone === "red"
            ? "text-red-600"
            : "text-gray-400";

  return (
    <div className={`${bgClass} rounded-xl p-3 border text-left ${borderClass}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function formatSalary(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

function formatWindow(w: QueueWindow): string {
  try {
    const start = new Date(w.startTime);
    const end = new Date(w.endTime);
    return `${start.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} → ${end.toLocaleString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return w.startTime;
  }
}

function JobSummarySection({ job }: { job: Partial<Job> }) {
  return (
    <div className="max-w-lg mx-auto w-full text-left space-y-2">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest px-1">
        Job Summary
      </h3>
      <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 bg-white text-sm overflow-hidden shadow-sm">
        {/* Title */}
        {job.title && (
          <div className="px-4 py-3 flex items-start gap-3">
            <Briefcase className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Title</p>
              <p className="font-semibold text-gray-900 mt-0.5">{job.title}</p>
            </div>
          </div>
        )}

        {/* Location + Type */}
        <div className="px-4 py-3 grid grid-cols-2 gap-4">
          {job.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
                <p className="font-medium text-gray-900 mt-0.5 text-xs">{job.location}</p>
              </div>
            </div>
          )}
          {job.type && (
            <div className="flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</p>
                <p className="font-medium text-gray-900 mt-0.5 text-xs">{job.type}</p>
              </div>
            </div>
          )}
        </div>

        {/* Salary */}
        {(job.salaryMin || job.salaryMax) ? (
          <div className="px-4 py-3 flex items-start gap-3">
            <DollarSign className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Salary Range</p>
              <p className="font-medium text-gray-900 mt-0.5 text-xs">
                {formatSalary(job.salaryMin ?? 0)} – {formatSalary(job.salaryMax ?? 0)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Description */}
        {job.description && (
          <div className="px-4 py-3 flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
              <p className="text-gray-700 mt-0.5 text-xs leading-relaxed line-clamp-4">{job.description}</p>
            </div>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="px-4 py-3 flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Requirements</p>
              <p className="text-gray-700 mt-0.5 text-xs leading-relaxed line-clamp-4">{job.requirements}</p>
            </div>
          </div>
        )}

        {/* Queue Windows */}
        {job.queueWindows && job.queueWindows.length > 0 && (
          <div className="px-4 py-3 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Queue Windows ({job.queueWindows.length})</p>
              <ul className="mt-1 space-y-0.5">
                {job.queueWindows.slice(0, 5).map((w, i) => (
                  <li key={i} className="text-xs text-gray-700 font-medium">{formatWindow(w)}</li>
                ))}
                {job.queueWindows.length > 5 && (
                  <li className="text-xs text-gray-400">+{job.queueWindows.length - 5} more…</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Questions */}
        {job.screeningQuestions && job.screeningQuestions.length > 0 && (
          <div className="px-4 py-3 flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#FF512F] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qualification Questions ({job.screeningQuestions.length})</p>
              <ul className="mt-1 space-y-0.5">
                {job.screeningQuestions.slice(0, 5).map((q, i) => (
                  <li key={i} className="text-xs text-gray-700 font-medium line-clamp-1">{q.text}</li>
                ))}
                {job.screeningQuestions.length > 5 && (
                  <li className="text-xs text-gray-400">+{job.screeningQuestions.length - 5} more…</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobPublishReview({
  review,
  screeningQuestions = [],
  jobData,
  isLoadingReview,
  isPublishing,
  publishingMessage,
  onBack,
  onPublish,
  onRetry,
}: JobPublishReviewProps) {
  const compliance = getComplianceReviewState(screeningQuestions);
  const alreadyPublished = review ? !isDraftJobStatus(review.jobStatus) : false;
  const reviewAllowsPublish = review ? canPublishFromReview(review) && !alreadyPublished : false;
  const canPublish = reviewAllowsPublish && compliance.allowsPublish;
  const hasQuestions = (review?.screeningQuestions ?? 0) > 0;
  const hasWindows = (review?.interviewWindows ?? 0) > 0;
  const windowsMet =
    hasWindows &&
    !review?.publishErrors.some((e) => e.toLowerCase().includes("window"));

  const complianceRowVariant =
    compliance.hasPending && !compliance.hasBlocked && compliance.requirementMet
      ? "warning"
      : "default";

  if (isPublishing && publishingMessage) {
    return <StepLoadingState message={publishingMessage} />;
  }

  if (isLoadingReview) {
    return (
      <StepLoadingState message="Running compliance review and checking publish requirements..." />
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="text-gray-600 text-sm font-medium">Could not load publish review.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2.5 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white text-xs font-bold uppercase tracking-widest rounded-xl"
            >
              Try Again
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="text-[#FF512F] text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Back to Edit
          </button>
        </div>
      </div>
    );
  }

  if (alreadyPublished) {
    return (
      <div className="space-y-8 text-center py-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-50">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">
            Already Published
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            This job is already live ({review.jobStatus}). The publish wizard only applies to drafts.
            Manage it from your jobs list.
          </p>
          {review.title && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">
              {review.title}
            </p>
          )}
        </div>
        <div className="flex justify-center pt-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="w-full max-w-xs px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:border-gray-300"
          >
            Back to Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-center py-4">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${canPublish ? "bg-green-50" : "bg-amber-50"
          }`}
      >
        {canPublish ? (
          <Check className="w-10 h-10 text-green-500" />
        ) : (
          <X className="w-10 h-10 text-amber-500" />
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">
          {canPublish ? "Ready to Post" : "Not Ready Yet"}
        </h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          {canPublish
            ? compliance.hasPending
              ? "Requirements are met. Some questions are still pending AI compliance review."
              : "Your job posting and interactive waiting room meet all requirements."
            : "Complete the items below before this job can go live."}
        </p>
        {review.title && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">{review.title}</p>
        )}
      </div>

      {jobData && <JobSummarySection job={jobData} />}

      <div className="max-w-md mx-auto grid grid-cols-2 gap-2 text-left">
        <ReviewStatCard label="Questions" value={review.screeningQuestions} />
        <ReviewStatCard label="Deal breakers" value={review.dealBreakerAnswers} />
        <ReviewStatCard label="Windows" value={review.interviewWindows} />
        <ReviewStatCard
          label="Credits"
          value={review.creditsRequired}
          valueSize="sm"
        />
        {compliance.counts.pending > 0 && (
          <ReviewStatCard
            label="Pending review"
            value={compliance.counts.pending}
            tone="slate"
          />
        )}
        {compliance.counts.approved > 0 && (
          <ReviewStatCard
            label="Clear"
            value={compliance.counts.approved}
            tone="green"
          />
        )}
        {compliance.counts.flagged > 0 && (
          <ReviewStatCard
            label="Caution"
            value={compliance.counts.flagged}
            tone="amber"
          />
        )}
        {compliance.counts.blocked > 0 && (
          <ReviewStatCard
            label="Blocked"
            value={compliance.counts.blocked}
            tone="red"
          />
        )}
      </div>

      <div className="max-w-md mx-auto space-y-2 py-2 text-left">
        <RequirementRow
          met={hasQuestions}
          label="Qualification questions"
          detail={
            hasQuestions
              ? `${review.screeningQuestions} question${review.screeningQuestions === 1 ? "" : "s"} added`
              : "Add at least one qualification question"
          }
        />
        <RequirementRow
          met={compliance.requirementMet}
          label="AI compliance"
          detail={compliance.requirementDetail}
          variant={complianceRowVariant}
        />
        <RequirementRow
          met={!!windowsMet}
          label="Interview windows"
          detail={
            windowsMet
              ? `${review.interviewWindows} window${review.interviewWindows === 1 ? "" : "s"} scheduled`
              : hasWindows
                ? review.publishErrors.find((e) => e.toLowerCase().includes("window")) ??
                "At least one window must end in the future"
                : "Schedule at least one interview window"
          }
        />
      </div>

      {compliance.hasPending && !compliance.hasBlocked && reviewAllowsPublish && (
        <div className="max-w-md mx-auto flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
          <p className="text-xs font-medium text-slate-700">
            {compliance.counts.pending} question
            {compliance.counts.pending === 1 ? " is" : "s are"} pending automated compliance review.
            Publishing is allowed for now; blocked questions will prevent publish when review is enforced.
          </p>
        </div>
      )}

      {review.publishErrors.length > 0 && (
        <div className="max-w-md mx-auto flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <ul className="text-xs font-medium text-amber-800 space-y-1">
            {review.publishErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-8 border-t border-gray-50 w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:text-gray-600 hover:border-gray-300 shadow-sm transition-all cursor-pointer"
        >
          Back to Edit
        </button>
        <GradientLoadingButton
          label="Publish Job"
          isLoading={isPublishing}
          disabled={!canPublish}
          onClick={onPublish}
        />
      </div>
    </div>
  );
}
