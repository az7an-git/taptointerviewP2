import type { JobApplicant, QueueEntryOutcome } from "@/types/job";
import { useCalledWindowCountdown } from "../../hooks/useCalledWindowCountdown";
import {
    formatJoinedTime,
    getParticipantDisplayName,
    getParticipantInitials,
    getSessionDetailLabel,
    normalizeQueueStatus,
} from "../../utils/queueEntryStatus";
import { StartInterviewButton } from "./StartInterviewButton";
import { QueueStatusBadge } from "./queueStatusBadge";
import { ScreeningAnswersList } from "./ScreeningAnswersList";

export interface QueueCandidateEntryProps {
    candidate: JobApplicant;
    index: number;
    variant: "mobile" | "table";
    isNext?: boolean;
    isActiveSession?: boolean;
    isStartingInterview?: boolean;
    onStartInterview?: () => void;
    onWindowExpired: () => void;
    onViewDetails?: (candidate: JobApplicant) => void;
}

function CandidateStatusAction({
    onStartInterview,
    isStartingInterview,
    status,
    outcome,
    isWindowExpired,
    secondsLeft,
    className,
}: {
    onStartInterview?: () => void;
    isStartingInterview?: boolean;
    status: string;
    outcome?: QueueEntryOutcome | null;
    isWindowExpired: boolean;
    secondsLeft: number | null;
    className?: string;
}) {
    if (onStartInterview) {
        return (
            <StartInterviewButton
                isLoading={!!isStartingInterview}
                onStart={onStartInterview}
                className={className}
            />
        );
    }
    return (
        <QueueStatusBadge
            status={status}
            outcome={outcome}
            isWindowExpired={isWindowExpired}
            secondsLeft={secondsLeft}
        />
    );
}

export function QueueCandidateEntry({
    candidate,
    index,
    variant,
    isActiveSession,
    isStartingInterview,
    onStartInterview,
    onWindowExpired,
    onViewDetails,
}: QueueCandidateEntryProps) {
    const status = normalizeQueueStatus(candidate.status);
    const isCalled = status === "called";
    const { secondsLeft, isWindowExpired } = useCalledWindowCountdown(
        candidate.admissionExpiresAt,
        isCalled,
        onWindowExpired
    );

    const displayName = getParticipantDisplayName(candidate.participant);
    const initials = getParticipantInitials(candidate.participant);
    const joinedLabel = formatJoinedTime(candidate.joinedAt);
    const sessionDetailLabel = getSessionDetailLabel(candidate);

    const statusBadge = (
        <QueueStatusBadge
            status={status}
            outcome={candidate.outcome}
            isWindowExpired={isWindowExpired}
            secondsLeft={secondsLeft}
        />
    );

    const statusAction = (
        <CandidateStatusAction
            onStartInterview={onStartInterview}
            isStartingInterview={isStartingInterview}
            status={status}
            outcome={candidate.outcome}
            isWindowExpired={isWindowExpired}
            secondsLeft={secondsLeft}
        />
    );

    if (variant === "mobile") {
        return (
            <div
                className={`p-4 flex flex-col gap-4 ${isActiveSession ? "bg-[#FFF5F2]/50" : "bg-white"}`}
            >
                <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-gray-400 mt-2.5 shrink-0 w-4 text-right">
                        #{index + 1}
                    </span>
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 shrink-0 text-sm">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        {/* Row 1: Name */}
                        {onViewDetails ? (
                            <button
                                onClick={() => onViewDetails(candidate)}
                                className="font-bold text-gray-900 text-sm hover:text-[#FF512F] text-left cursor-pointer transition-colors w-full break-words"
                                title={displayName}
                            >
                                {displayName}
                            </button>
                        ) : (
                            <span
                                className="font-bold text-gray-900 text-sm break-words block w-full"
                                title={displayName}
                            >
                                {displayName}
                            </span>
                        )}
                        {/* Row 2: Status + Joined */}
                        <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="shrink-0">{statusBadge}</div>
                            <p className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                Joined {joinedLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {(candidate.screeningAnswers.length > 0 || sessionDetailLabel || onStartInterview) && (
                    <div className="flex flex-col gap-3">
                        {candidate.screeningAnswers.length > 0 && (
                            <ScreeningAnswersList
                                answers={candidate.screeningAnswers}
                            />
                        )}
                        {sessionDetailLabel && (
                            <p className="text-[10px] text-gray-400 font-medium">
                                {sessionDetailLabel}
                            </p>
                        )}
                        {onStartInterview && (
                            <div className="pt-1">
                                <StartInterviewButton
                                    isLoading={!!isStartingInterview}
                                    onStart={onStartInterview}
                                    className="w-full sm:w-auto"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    const rowHighlight = isActiveSession
        ? "bg-[#FFF5F2]/50"
        : "hover:bg-gray-50/50";
    const hasScreening = candidate.screeningAnswers.length > 0;

    return (
        <tr className={`transition-colors align-top ${rowHighlight}`}>
            <td colSpan={4} className="px-0 align-top py-3 sm:py-4">
                <div className="flex flex-col">
                    <div className="grid grid-cols-[3rem_minmax(0,1fr)_8rem_11.25rem] min-h-10 shrink-0 items-center">
                        <div className="px-4 sm:px-6">
                            <span className="text-gray-400 font-bold text-xs sm:text-sm">
                                #{index + 1}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 px-3 sm:px-6">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 shrink-0 text-[10px] sm:text-sm">
                                {initials}
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                {onViewDetails ? (
                                    <button
                                        onClick={() => onViewDetails(candidate)}
                                        className="font-bold text-gray-900 text-xs sm:text-sm truncate min-w-0 hover:text-[#FF512F] text-left cursor-pointer transition-colors"
                                        title="Click to view details"
                                    >
                                        {displayName}
                                    </button>
                                ) : (
                                    <span
                                        className="font-bold text-gray-900 text-xs sm:text-sm truncate min-w-0"
                                        title={displayName}
                                    >
                                        {displayName}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="px-3 sm:px-6">
                            <div className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">
                                {joinedLabel}
                            </div>
                        </div>
                        <div className="px-3 sm:px-6">{statusAction}</div>
                    </div>

                    {hasScreening && (
                        <div className="grid grid-cols-[3rem_minmax(0,1fr)_8rem_11.25rem]">
                            <div aria-hidden />
                            <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-4 pl-[calc(2.5rem+0.75rem)] min-w-0">
                                <ScreeningAnswersList answers={candidate.screeningAnswers} />
                            </div>
                            <div aria-hidden />
                            <div aria-hidden />
                        </div>
                    )}

                    {sessionDetailLabel && (
                        <div className="grid grid-cols-[3rem_minmax(0,1fr)_8rem_11.25rem]">
                            <div aria-hidden />
                            <div className="px-3 sm:px-6 pb-3 sm:pb-4 pl-[calc(2.5rem+0.75rem)] min-w-0">
                                <p className="text-[10px] text-gray-400 font-medium truncate">
                                    {sessionDetailLabel}
                                </p>
                            </div>
                            <div aria-hidden />
                            <div aria-hidden />
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}
