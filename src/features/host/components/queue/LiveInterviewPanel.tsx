import { Square, Video, AlertTriangle, RefreshCw } from "lucide-react";
import type { JobApplicant } from "@/types/job";
import { getParticipantDisplayName, mergeApplicantUpdate } from "../../utils/queueEntryStatus";
import { ScreeningAnswersList } from "./ScreeningAnswersList";
import { LiveInterviewPanelSkeleton } from "./queuePanelSkeletons";
import { useDailySession } from "@/hooks/useDailySession";
import { useEffect, useRef, Dispatch, SetStateAction } from "react";
import { Spinner } from "@/common/ui/Spinner";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";

import { getQueueApiErrorMessage } from "../../utils/queueApiErrors";

interface LiveInterviewPanelProps {
    jobId: string;
    candidate: JobApplicant;
    isLoading: boolean;
    onEnd: () => void;
    setLocalApplicants: Dispatch<SetStateAction<JobApplicant[] | undefined>>;
}

export function LiveInterviewPanel({
    jobId,
    candidate,
    isLoading,
    onEnd,
    setLocalApplicants,
}: LiveInterviewPanelProps) {
    const firstName = candidate.participant?.firstName ?? "";
    const lastName = candidate.participant?.lastName ?? "";
    const name = getParticipantDisplayName(candidate.participant);
    const initials =
        `${firstName[0] ?? "?"}${lastName[0] ?? ""}`.toUpperCase();

    const containerRef = useRef<HTMLDivElement>(null);
    const hasConnectedRef = useRef(false);
    const timeoutRef = useRef<any>(null);

    const { status: dailyStatus, error: dailyError, joinSession, leaveSession } = useDailySession({
        containerRef,
        roomUrl: candidate.roomUrl,
        token: candidate.hostToken,
        onParticipantJoined: async (_participant) => {
            if (!hasConnectedRef.current) {
                hasConnectedRef.current = true;
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                try {
                    const res = await jobsApi.sessionConnected(jobId, candidate.queueEntryId);
                    if (res.data) {
                        setLocalApplicants((prev) => mergeApplicantUpdate(prev, res.data));
                        toast.success("Candidate connected successfully.");
                    }
                } catch (err: any) {
                    console.error("Failed to report candidate connection:", err);
                    console.error("CONNECTION ERROR DATA:", JSON.stringify(err.response?.data));
                    const msg = getQueueApiErrorMessage(err, "Failed to report candidate connection.");
                    toast.error(msg);
                }
            }
        },
    });

    useEffect(() => {
        if (dailyStatus === "joined" && !hasConnectedRef.current && !timeoutRef.current) {
            timeoutRef.current = setTimeout(async () => {
                if (!hasConnectedRef.current) {
                    try {
                        const res = await jobsApi.sessionConnectionFailed(jobId, candidate.queueEntryId);
                        if (res.data) {
                            setLocalApplicants((prev) => mergeApplicantUpdate(prev, res.data));
                        }
                        toast.error("Candidate failed to connect in time.");
                    } catch (err: any) {
                        console.error("Failed to report candidate connection timeout:", err);
                        console.error("TIMEOUT ERROR DATA:", JSON.stringify(err.response?.data));
                        const msg = getQueueApiErrorMessage(err, "Failed to report connection timeout.");
                        toast.error(msg);
                    }
                }
            }, 10000); // 10 seconds timeout
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [dailyStatus, jobId, candidate.queueEntryId, setLocalApplicants]);

    useEffect(() => {
        if (candidate.roomUrl && candidate.hostToken) {
            joinSession();
        } else {
            const storedRoomUrl = localStorage.getItem(`roomUrl_${candidate.queueEntryId}`);
            const storedHostToken = localStorage.getItem(`hostToken_${candidate.queueEntryId}`);
            if (storedRoomUrl && storedHostToken) {
                setLocalApplicants((prev) => mergeApplicantUpdate(prev, null, candidate.queueEntryId, {
                    roomUrl: storedRoomUrl,
                    hostToken: storedHostToken,
                }));
            } else {
                console.error("No room details found in localStorage or props for active session.");
            }
        }
    }, [candidate.roomUrl, candidate.hostToken, candidate.queueEntryId, joinSession, setLocalApplicants]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "You have an active interview session. Are you sure you want to leave?";
            return e.returnValue;
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        (window as any).__activeInterview = true;
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            (window as any).__activeInterview = false;
        };
    }, []);

    // End interview wrapper to also leave session
    const handleEnd = () => {
        leaveSession();
        onEnd();
    };

    if (isLoading) return <LiveInterviewPanelSkeleton />;

    return (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 mb-1 rounded-xl sm:rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden min-w-0">
            <div className="h-1 bg-gradient-to-r from-red-500 to-red-600" />
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-red-100 bg-red-50/80 flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 truncate">
                    Interview In Progress
                </span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 bg-gradient-to-r from-red-50/60 to-white">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-red-100 flex items-center justify-center text-sm font-bold text-red-600 shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3
                            className="text-sm sm:text-base font-bold text-gray-900 truncate"
                            title={name}
                        >
                            {name}
                        </h3>
                        <p className="text-xs sm:text-sm text-red-600/80 font-medium mt-1">
                            Session is active. End the interview when you have finished.
                        </p>
                        {candidate.screeningAnswers.length > 0 && (
                            <ScreeningAnswersList
                                answers={candidate.screeningAnswers}
                                className="mt-3"
                            />
                        )}
                    </div>
                </div>

                {/* Daily.co Video Container */}
                <div className="relative w-full rounded-xl overflow-hidden bg-black flex flex-col items-center justify-center border border-red-200 min-h-[650px]">
                    {!candidate.roomUrl && (
                        <div className="text-white/60 flex flex-col items-center gap-2">
                            <Video className="w-8 h-8 opacity-50" />
                            <p className="text-sm font-medium">No room URL returned by the backend.</p>
                        </div>
                    )}

                    {dailyStatus === "error" && dailyError && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/80 z-20">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-lg w-full">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300 font-medium leading-snug">{dailyError}</p>
                                </div>
                                <button
                                    className="shrink-0 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer border border-red-500/30 shadow-sm"
                                    onClick={joinSession}
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {dailyStatus === "fetching" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-3">
                            <Spinner className="w-8 h-8 border-t-2 border-b-2 border-red-500" />
                            <p className="text-sm text-white/70 font-medium">Connecting to video...</p>
                        </div>
                    )}

                    <div
                        ref={containerRef}
                        className="absolute inset-0 w-full h-full"
                    />
                </div>

                <button
                    onClick={handleEnd}
                    disabled={isLoading}
                    className="w-full sm:w-auto sm:self-end bg-red-600 hover:bg-red-700 text-white px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
                >
                    <Square className="w-4 h-4 shrink-0" />
                    End Interview
                </button>
            </div>
        </div>
    );
}
