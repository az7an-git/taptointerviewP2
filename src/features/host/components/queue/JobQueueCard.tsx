import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, PauseCircle, Clock, Bell, Send } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { Job, JobApplicant, WindowRequest } from "@/types/job";
import { toast } from "sonner";
import { jobsApi } from "@/api/jobsApi";
import { useAuth } from "@/context/AuthContext";
import {
    getLiveQueueState,
    LiveQueueState,
    normalizeWindowStatus,
    isWindowInLiveSlot,
} from "../../utils/queueWindowLive";
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
import { CloseDecisionModal } from "./CloseDecisionModal";
import { WindowClosingWarningBanner } from "./WindowClosingWarningBanner";
import { RecruiterRequestModal } from "./RecruiterRequestModal";
import { WindowRequestsInboxModal } from "./WindowRequestsInboxModal";

import { useCandidateReadyAlerts } from "@/hooks/useCandidateReadyAlerts";

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
    onSessionChange?: (closedJobId?: string) => Promise<void> | void;
    isAnyAdmitting: boolean;
    setIsAnyAdmitting: (val: boolean) => void;
}) {
    const { user } = useAuth();
    const isAdmin = user?.role !== "interviewer";
    const location = useLocation();
    const navigate = useNavigate();

    const [isAdmitting, setIsAdmitting] = useState(false);
    const [localApplicants, setLocalApplicants] = useState<JobApplicant[] | undefined>(
        job.applicants
    );
    const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);
    const expiredFiredRef = useRef(false);

    // Milestone 2 State
    const [closeDecisionModalOpen, setCloseDecisionModalOpen] = useState(false);
    const [recruiterRequestModalOpen, setRecruiterRequestModalOpen] = useState(false);
    const [windowRequestsInboxOpen, setWindowRequestsInboxOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<WindowRequest[]>([]);
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [warningPayload, setWarningPayload] = useState<{ minutes_remaining: number; waiting_count: number } | null>(null);

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
        const activeStatuses = ["waiting", "called", "admitted", "confirmed", "in_session", "pending_outcome"];
        return [...localApplicants]
            .filter((c) => activeStatuses.includes(normalizeQueueStatus(c.status)))
            .sort(
                (a, b) => queueStatusSortWeight(a.status) - queueStatusSortWeight(b.status)
            );
    }, [localApplicants]);

    const nextCandidate = candidates.find(
        (c) => normalizeQueueStatus(c.status) === "waiting"
    );

    // Candidate Ready Alerts hook
    const isCandidateReady = Boolean(nextCandidate && (normalizeQueueStatus(nextCandidate.status) === "waiting" || normalizeQueueStatus(nextCandidate.status) === "admitted"));
    useCandidateReadyAlerts({
        isCandidateReady,
        jobTitle: job.title,
    });
    const waitingCount = candidates.filter(c => normalizeQueueStatus(c.status) === "waiting").length;
    const sessionCandidate = findSessionCandidate(localApplicants, user?.id);

    const userHasActiveSession = Boolean(
        sessionCandidate &&
        sessionCandidate.isHost !== false &&
        blocksAdmitNext(sessionCandidate.status)
    );
    const admitBlocked = job.canAdmitNext === false || userHasActiveSession;

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
            : job.queueStatus === "wrapping_up"
                ? "wrapping_up"
                : "open";
    const isQueuePaused = liveQueueState === "paused";

    // Update local time periodically for countdowns and live status checks
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    // Find active or wrapping_up window
    const activeWindow = useMemo(() => {
        return job.queueWindows?.find(
            (w) =>
                normalizeWindowStatus(w.status) === "Open" ||
                normalizeWindowStatus(w.status) === "wrapping_up" ||
                (normalizeWindowStatus(w.status) === "Scheduled" && isWindowInLiveSlot(w, new Date(now)))
        );
    }, [job.queueWindows, now]);

    // Check if close decision prompt is required
    useEffect(() => {
        const stateWindowId = location.state?.triggerCloseEarly;
        const currentWindowId = activeWindow?.id || job.queueWindows?.[0]?.id;
        if (stateWindowId && stateWindowId === currentWindowId) {
            setCloseDecisionModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        } else if (job.pendingCloseDecision || activeWindow?.pendingCloseDecision) {
            setCloseDecisionModalOpen(true);
        }
    }, [job.pendingCloseDecision, activeWindow?.pendingCloseDecision, location.state, activeWindow?.id, job.queueWindows, location.pathname, navigate]);

    // Fetch pending requests for admins
    const fetchPendingRequests = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await jobsApi.listWindowRequests(job.id);
            const pending = (res.data || []).filter((r: WindowRequest) => r.status === "pending");
            setPendingRequests(pending);
        } catch {
            // Ignore error
        }
    }, [job.id, isAdmin]);

    useEffect(() => {
        void fetchPendingRequests();
    }, [fetchPendingRequests]);

    // Realtime integration
    const refreshFromRealtime = useCallback(() => {
        onSessionChange?.();
    }, [onSessionChange]);

    useJobRealtime(job.id, refreshFromRealtime, {
        onWindowClosingWarning: (payload) => {
            setWarningPayload({
                minutes_remaining: payload.minutes_remaining || 15,
                waiting_count: payload.waiting_count || waitingCount,
            });
            toast.warning(payload.message || "Interview window ending soon!");
        },
        onWindowClosePrompt: (payload) => {
            if (payload.pending_close_decision) {
                setCloseDecisionModalOpen(true);
            }
        },
        onWindowRequestCreated: () => {
            if (isAdmin) {
                toast.info("New window request received from recruiter.");
                void fetchPendingRequests();
            }
        },
        onWindowRequestReviewed: (payload) => {
            const actionText = payload.action || payload.request?.status || "processed";
            toast.info(`Window request was ${actionText}.`);
            onSessionChange?.();
        },
    });

    // Check 15-minute countdown locally
    const minutesRemaining = useMemo(() => {
        if (!activeWindow?.endTime) return null;
        const status = normalizeWindowStatus(activeWindow.status);
        if (status === "wrapping_up" || status === "Closed") return null;
        if (warningPayload) return warningPayload.minutes_remaining;
        const msLeft = new Date(activeWindow.endTime).getTime() - now;
        if (msLeft > 0 && msLeft <= 15 * 60 * 1000) {
            return Math.ceil(msLeft / (60 * 1000));
        }
        return null;
    }, [warningPayload, activeWindow?.endTime, activeWindow?.status, now]);

    const [isWindowActionLoading, setIsWindowActionLoading] = useState(false);

    // Admin extend window handler
    const handleAdminExtendWindow = async (minutes: number) => {
        const targetWindowId = activeWindow?.id || job.queueWindows?.[0]?.id;
        if (!targetWindowId) return;
        setIsWindowActionLoading(true);
        try {
            await jobsApi.extendWindow(job.id, targetWindowId, minutes);
            toast.success(`Window extended by ${minutes} minutes.`);
            setWarningPayload(null);
            onSessionChange?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.data || "Failed to extend window.");
        } finally {
            setIsWindowActionLoading(false);
        }
    };

    // Admin close early handler
    const handleAdminCloseEarlyWindow = () => {
        setCloseDecisionModalOpen(true);
    };

    const handleConfirmCloseDecision = async (decision: "continue" | "release") => {
        const targetWindowId = activeWindow?.id || job.queueWindows?.[0]?.id;
        if (!targetWindowId) return;
        setIsSubmittingDecision(true);
        try {
            const isAlreadyWrappingUp = activeWindow?.status === "wrapping_up" || job.queueStatus === "wrapping_up";

            if (!isAlreadyWrappingUp) {
                const earlyRes = await jobsApi.closeWindowEarly(job.id, targetWindowId);
                if (earlyRes?.data?.pending_close_decision === false) {
                    toast.success(earlyRes?.data?.message || "Window closed early.");
                    setCloseDecisionModalOpen(false);
                    await onSessionChange?.(job.id);
                    return;
                }
            }

            const res = await jobsApi.closeWindowDecision(job.id, targetWindowId, decision);
            toast.success(res.data.message || "Close decision recorded.");
            setCloseDecisionModalOpen(false);
            await onSessionChange?.(job.id);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.data || err?.response?.data?.message || "Failed to submit close decision.";
            toast.error(typeof errorMsg === "string" ? errorMsg : "Failed to submit close decision.");
        } finally {
            setIsSubmittingDecision(false);
        }
    };

    // Submit Recruiter Request
    const handleSubmitRecruiterRequest = async (payload: {
        window_id: string;
        request_type: any;
        extend_minutes?: number;
        note?: string;
    }) => {
        setIsSubmittingRequest(true);
        try {
            await jobsApi.createWindowRequest(job.id, payload);
            toast.success("Window request submitted to admin!");
            setRecruiterRequestModalOpen(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.data || "Failed to submit request.");
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    // Admin Review Request
    const handleReviewRequest = async (
        requestId: string,
        action: "approve" | "decline",
        extendMinutesOverride?: number
    ) => {
        setProcessingRequestId(requestId);
        try {
            await jobsApi.reviewWindowRequest(job.id, requestId, {
                action,
                extend_minutes: extendMinutesOverride,
            });
            toast.success(action === "approve" ? "Request approved!" : "Request declined.");
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
            onSessionChange?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.data || "Failed to review request.");
        } finally {
            setProcessingRequestId(null);
        }
    };

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
            {/* Header with Admin Request Inbox Badge */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-200/80 bg-white">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#FF512F]/10 to-[#FF7A00]/10 border border-[#FF512F]/20 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                        <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF512F]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                                {job.title}
                            </h2>
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
                        <div className="text-[11px] sm:text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="truncate max-w-full">{job.location || "Remote"}</span>
                            <span className="hidden sm:inline">&bull;</span>
                            <span className="shrink-0">{job.type || "Full-time"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {!isAdmin && activeWindow?.id && (minutesRemaining === null || minutesRemaining <= 0) && (
                        <button
                            type="button"
                            onClick={() => setRecruiterRequestModalOpen(true)}
                            className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#FF512F] border border-orange-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Request Time
                        </button>
                    )}

                    <button
                        onClick={handleAdmitNext}
                        disabled={isAdmitting || isAnyAdmitting || isQueuePaused || !nextCandidate || admitBlocked}
                        title={
                            admitDisabledReason ??
                            (admitNextShortName
                                ? `Admit Next: ${admitNextShortName}`
                                : undefined)
                        }
                        className={`w-full sm:w-auto sm:min-w-0 sm:max-w-[240px] md:max-w-[280px] text-white hover:bg-[#E64A2E] px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0 overflow-hidden ${isCandidateReady && !admitBlocked && !isQueuePaused
                            ? "animate-pulse shadow-lg shadow-[#FF512F]/40 border-2 border-orange-400 ring-2 ring-[#FF512F]/30 bg-gradient-to-r from-[#FF512F] to-[#FF7A00]"
                            : "bg-[#FF512F]"
                            }`}
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
            </div>

            {/* Employer Operational Guidance Banner 2: 90-Second Countdown Explanation */}
            {candidates.some((c) => normalizeQueueStatus(c.status) === "called") && (
                <div className="mx-3 sm:mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/90 px-3.5 py-3 text-left shadow-2xs">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 leading-relaxed font-medium">
                        <strong>90-Second Candidate Countdown:</strong> Candidates have 90 seconds to respond to their admission notification. If missed, they are moved to the back of the queue (or returned to pool), and your interview credit is protected/refunded automatically.
                    </div>
                </div>
            )}

            {/* 15-Minute Warning Banner */}
            {minutesRemaining !== null && minutesRemaining > 0 && (
                <WindowClosingWarningBanner
                    minutesRemaining={minutesRemaining}
                    waitingCount={waitingCount}
                    isAdmin={isAdmin}
                    isActionLoading={isWindowActionLoading}
                    onExtend={handleAdminExtendWindow}
                    onCloseEarly={handleAdminCloseEarlyWindow}
                    onRequestExtension={() => setRecruiterRequestModalOpen(true)}
                    onRequestEarlyClose={() => setRecruiterRequestModalOpen(true)}
                />
            )}

            {/* Employer Operational Guidance Banner 3: Queue Inactivity Pauses */}
            {isQueuePaused && (
                <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left shadow-2xs">
                    <div className="flex items-start gap-2.5">
                        <PauseCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-amber-900">Queue Inactivity Pause Active</p>
                            <p className="text-xs font-medium text-amber-800/90 mt-0.5 leading-relaxed">
                                Waiting candidates remain protected in line during an inactivity pause. Click Resume to open admissions and call waiting candidates.
                            </p>
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => jobsApi.updateQueueWindowStatus(job.id, "open").then(() => onSessionChange?.())}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                            Resume Queue
                        </button>
                    )}
                </div>
            )}

            {(liveQueueState === "wrapping_up" || job.queueStatus === "wrapping_up") && (
                <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 ease-out text-left">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs uppercase">Window Wrapping Up</span>
                            {(job.pendingCloseDecision || activeWindow?.pendingCloseDecision) && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-200/90 text-amber-900 uppercase tracking-wider shrink-0 shadow-2xs">
                                    Action Required
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium">
                            Closed to new candidates. Ongoing interviews & waiting queue remain protected.
                        </p>
                        {isAdmin && (job.pendingCloseDecision || activeWindow?.pendingCloseDecision) && (
                            <button
                                type="button"
                                onClick={() => setCloseDecisionModalOpen(true)}
                                className="w-full sm:w-auto mt-3 px-4 py-2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:opacity-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm touch-manipulation flex items-center justify-center gap-1.5"
                            >
                                Decide Queue Action
                            </button>
                        )}
                    </div>
                </div>
            )}

            {sessionCandidate && (sessionCandidate.isHost === false || sessionCandidate.participant === null) && (sessionStatus === "in_session" || sessionCandidate.interviewInProgress) && (
                <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-xs text-left">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🔒</span>
                        <div>
                            <h3 className="font-bold text-amber-900 text-sm">Interview in Progress</h3>
                            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                                Another recruiter is currently interviewing this candidate. Your view remains read-only to protect session integrity.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {sessionCandidate && sessionCandidate.isHost !== false && sessionCandidate.participant !== null && sessionStatus === "in_session" && (
                <LiveInterviewPanel
                    jobId={job.id}
                    candidate={sessionCandidate}
                    isLoading={sessionAction === "end"}
                    onEnd={handleEndSession}
                    setLocalApplicants={setLocalApplicants}
                />
            )}

            {sessionCandidate && sessionCandidate.isHost !== false && sessionStatus === "pending_outcome" && (
                <PendingOutcomeBanner
                    candidate={sessionCandidate}
                    isLoading={isSavingOutcome}
                    onOpenModal={() => setOutcomeModalOpen(true)}
                />
            )}

            {sessionCandidate && sessionCandidate.isHost !== false && (
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

            {/* Close Decision Modal (Continue vs Release) */}
            <CloseDecisionModal
                isOpen={closeDecisionModalOpen}
                waitingCount={waitingCount}
                activeInterviews={sessionStatus === "in_session" ? 1 : 0}
                isSubmitting={isSubmittingDecision}
                isCloseEarly={!(activeWindow?.status === "wrapping_up" || job.queueStatus === "wrapping_up")}
                onClose={() => setCloseDecisionModalOpen(false)}
                onConfirmDecision={handleConfirmCloseDecision}
            />

            {/* Recruiter Request Modal */}
            <RecruiterRequestModal
                isOpen={recruiterRequestModalOpen}
                windowId={activeWindow?.id || job.queueWindows?.[0]?.id || ""}
                isSubmitting={isSubmittingRequest}
                onClose={() => setRecruiterRequestModalOpen(false)}
                onSubmitRequest={handleSubmitRecruiterRequest}
            />

            {/* Admin Window Requests Inbox Modal */}
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
