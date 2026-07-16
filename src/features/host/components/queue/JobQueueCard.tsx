import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ClipboardList, PauseCircle } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { Job, JobApplicant } from "@/types/job";
import { toast } from "sonner";
import { jobsApi } from "@/api/jobsApi";
import { getLiveQueueState, type LiveQueueState } from "../../utils/queueWindowLive";
import { getQueueApiErrorMessage } from "../../utils/queueApiErrors";
import {
    blocksAdmitNext,
    findSessionCandidate,
    getAdmitNextShortName,
    mergeApplicantUpdate,
    normalizeQueueStatus,
    queueStatusSortWeight,
} from "../../utils/queueEntryStatus";
import { useQueueCardSession } from "../../hooks/useQueueCardSession";
import { useJobRealtime } from "@/hooks/useJobRealtime";
import { tryShowCreditsApiError } from "@/hooks/creditNotifications";
import { LiveInterviewPanel } from "./LiveInterviewPanel";
import {
    InterviewOutcomeModal,
    PendingOutcomeBanner,
} from "./InterviewOutcomeModal";
import { QueueCandidateList } from "./QueueCandidateList";
import { ApplicantDetailsModal } from "./ApplicantDetailsModal";

export function JobQueueCard({
    job,
    onWindowExpired,
    onCreditUpdated,
    onSessionChange,
    isAnyAdmitting,
    setIsAnyAdmitting,
}: {
    job: Job;
    onWindowExpired: () => void;
    onCreditUpdated: (balance: number) => void;
    onSessionChange?: () => Promise<void> | void;
    isAnyAdmitting: boolean;
    setIsAnyAdmitting: (val: boolean) => void;
}) {
    const [isAdmitting, setIsAdmitting] = useState(false);
    const [localApplicants, setLocalApplicants] = useState<JobApplicant[] | undefined>(
        job.applicants
    );
    const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);
    const expiredFiredRef = useRef(false);

    useEffect(() => {
        setLocalApplicants((prev) => {
            if (!job.applicants) return undefined;
            if (!prev) return job.applicants;
            return job.applicants.map((newApp) => {
                const existing = prev.find((p) => p.queueEntryId === newApp.queueEntryId);
                if (existing) {
                    return {
                        ...newApp,
                        sessionDurationSeconds: newApp.sessionDurationSeconds ?? existing.sessionDurationSeconds,
                        sessionStartedAt: newApp.sessionStartedAt ?? existing.sessionStartedAt,
                        sessionEndedAt: newApp.sessionEndedAt ?? existing.sessionEndedAt,
                    };
                }
                return newApp;
            });
        });
    }, [job.applicants]);

    const candidates = useMemo(() => {
        if (!localApplicants) return [];
        return [...localApplicants].sort(
            (a, b) => queueStatusSortWeight(a.status) - queueStatusSortWeight(b.status)
        );
    }, [localApplicants]);

    const nextCandidate = candidates.find(
        (c) => normalizeQueueStatus(c.status) === "waiting"
    );
    const admitBlocked = candidates.some((c) => blocksAdmitNext(c.status));
    const sessionCandidate = findSessionCandidate(localApplicants);

    const {
        sessionAction,
        sessionStatus,
        outcomeModalOpen,
        setOutcomeModalOpen,
        handleStartSession,
        handleEndSession,
        handleSaveOutcome,
        isSavingOutcome,
    } = useQueueCardSession(job.id, sessionCandidate, setLocalApplicants, onSessionChange);

    const liveQueueState: LiveQueueState = job.queueWindows?.length
        ? getLiveQueueState(job.queueWindows)
        : job.queuePauseStatus === "paused"
            ? "paused"
            : "open";
    const isQueuePaused = liveQueueState === "paused";

    const handleAdmitNext = async () => {
        if (isQueuePaused) {
            toast.error("Resume the queue before admitting the next candidate.");
            return;
        }
        setIsAdmitting(true);
        setIsAnyAdmitting(true);
        expiredFiredRef.current = false;
        try {
            const res = await jobsApi.admitNextParticipant(job.id);
            toast.success("Called next participant successfully!");

            if (res.status === "success" && res.data) {
                const { queue_entry_id, balance, admission_expires_at } = res.data;
                onCreditUpdated(balance);
                setLocalApplicants((prev) =>
                    mergeApplicantUpdate(prev, null, queue_entry_id, {
                        status: "called",
                        admissionExpiresAt: admission_expires_at,
                    })
                );
                if (onSessionChange) {
                    await onSessionChange();
                }
            }
        } catch (error: unknown) {
            if (!tryShowCreditsApiError(error, "No credits remaining. Purchase more to continue interviews.")) {
                toast.error(getQueueApiErrorMessage(error, "Failed to admit next participant."));
            }
            console.error(error);
        } finally {
            setIsAdmitting(false);
            setIsAnyAdmitting(false);
        }
    };

    const handleWindowExpired = useCallback(() => {
        if (expiredFiredRef.current) return;
        expiredFiredRef.current = true;
        onWindowExpired();
    }, [onWindowExpired]);

    const refreshFromRealtime = useCallback(() => {
        onSessionChange?.();
    }, [onSessionChange]);

    useJobRealtime(job.id, refreshFromRealtime);

    const admitDisabledReason = isQueuePaused
        ? "Resume the queue on the job page before admitting"
        : admitBlocked
            ? "Finish the current interview (start → end → outcome) before calling the next person"
            : isAnyAdmitting
                ? "Admitting a candidate..."
                : !nextCandidate
                    ? "No one waiting in the queue"
                    : undefined;

    const admitNextShortName = nextCandidate
        ? getAdmitNextShortName(nextCandidate.participant)
        : "";

    return (
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm mb-4 sm:mb-6 min-w-0 max-w-full">
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-200/80 bg-white">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-gray-100 shadow-sm rounded-lg flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                            {job.title}
                        </h2>
                        <div className="text-[11px] sm:text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="truncate max-w-full">{job.location || "Remote"}</span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span className="shrink-0">{job.type || "Full-time"}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAdmitNext}
                    disabled={isAdmitting || isAnyAdmitting || isQueuePaused || !nextCandidate || admitBlocked}
                    title={
                        admitDisabledReason ??
                        (admitNextShortName
                            ? `Admit Next: ${admitNextShortName}`
                            : undefined)
                    }
                    className="w-full sm:w-auto sm:min-w-0 sm:max-w-[240px] md:max-w-[280px] bg-[#FF512F] text-white hover:bg-[#E64A2E] px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0 overflow-hidden"
                >
                    {isAdmitting ? (
                        <Spinner className="w-4 h-4 border-2 border-white/30 border-t-white shrink-0" />
                    ) : (
                        <span className="truncate min-w-0">
                            Admit Next{admitNextShortName ? `: ${admitNextShortName}` : ""}
                        </span>
                    )}
                </button>
            </div>

            {isQueuePaused && (
                <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-left">
                    <PauseCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-800">
                        Queue is paused. Resume it from the job page before calling the next
                        candidate.
                    </p>
                </div>
            )}

            {sessionCandidate && sessionStatus === "in_session" && (
                <LiveInterviewPanel
                    jobId={job.id}
                    candidate={sessionCandidate}
                    isLoading={sessionAction === "end"}
                    onEnd={handleEndSession}
                    setLocalApplicants={setLocalApplicants}
                />
            )}

            {sessionCandidate && sessionStatus === "pending_outcome" && (
                <PendingOutcomeBanner
                    candidate={sessionCandidate}
                    isLoading={isSavingOutcome}
                    onOpenModal={() => setOutcomeModalOpen(true)}
                />
            )}

            {sessionCandidate && (
                <InterviewOutcomeModal
                    isOpen={outcomeModalOpen && sessionStatus === "pending_outcome"}
                    candidate={sessionCandidate}
                    isSaving={isSavingOutcome}
                    onClose={() => setOutcomeModalOpen(false)}
                    onConfirm={handleSaveOutcome}
                />
            )}

            <QueueCandidateList
                candidates={candidates}
                nextCandidateId={nextCandidate?.queueEntryId}
                sessionCandidateId={sessionCandidate?.queueEntryId}
                sessionStatus={sessionStatus}
                sessionAction={sessionAction}
                onStartInterview={handleStartSession}
                onWindowExpired={handleWindowExpired}
                onViewDetails={setSelectedApplicant}
            />

            <ApplicantDetailsModal
                jobId={job.id}
                applicant={selectedApplicant}
                isOpen={!!selectedApplicant}
                onClose={() => setSelectedApplicant(null)}
            />
        </div>
    );
}
