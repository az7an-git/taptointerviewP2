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

    const displayName = getParticipantDisplayName(
        candidate.participant,
        candidate.interviewInProgress ? "Hidden (Active Session)" : "Candidate"
    );
    const initials = getParticipantInitials(
        candidate.participant,
        candidate.interviewInProgress ? "🔒" : "C"
    );
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
                className={`p-3.5 flex flex-col gap-3 ${isActiveSession ? "bg-[#FFF5F2]/50" : "hover:bg-[#FFF5F2]/40 bg-white transition-colors"}`}
            >
                {/* Header Row: Avatar + Name (Left) & Status Badge + Joined Time (Right) */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-gray-400 shrink-0 w-4 text-right">
                            #{index + 1}
                        </span>
                        <div className="w-9 h-9 bg-gradient-to-br from-[#FF512F]/15 to-[#FF7A00]/15 border border-[#FF512F]/20 rounded-full flex items-center justify-center font-bold text-[#FF512F] shrink-0 text-xs shadow-2xs">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            {onViewDetails ? (
                                <button
                                    onClick={() => onViewDetails(candidate)}
                                    className="font-bold text-gray-900 text-sm hover:text-[#FF512F] text-left cursor-pointer transition-colors block w-full truncate"
                                    title={displayName}
                                >
                                    {displayName}
                                </button>
                            ) : (
                                <span
                                    className="font-bold text-gray-900 text-sm truncate block w-full"
                                    title={displayName}
                                >
                                    {displayName}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                        <div>{statusBadge}</div>
                        <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                            Joined {joinedLabel}
                        </span>
                    </div>
                </div>

                {((candidate.screeningAnswers.length > 0 && !isActiveSession) || sessionDetailLabel || onStartInterview) && (
                    <div className="flex flex-col gap-2 pt-0.5">
                        {candidate.screeningAnswers.length > 0 && !isActiveSession && (
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
        : "hover:bg-[#FFF5F2]/40 group";
    const hasScreening = candidate.screeningAnswers.length > 0 && !isActiveSession;

    return (
        <tr className={`transition-colors align-top ${rowHighlight}`}>
            <td colSpan={4} className="px-0 align-top h-full">
                <div className="grid grid-cols-[3rem_minmax(0,1fr)_8rem_11.25rem] h-full items-stretch min-h-16">
                    {/* Col 1 */}
                    <div className="px-4 sm:px-6 border-r border-gray-200/50 flex pt-3 sm:pt-4 pb-3 sm:pb-4 h-full">
                        <span className="text-gray-400 font-bold text-xs sm:text-sm pt-2.5">
                            #{index + 1}
                        </span>
                    </div>

                    {/* Col 2 */}
                    <div className="flex flex-col min-w-0 border-r border-gray-200/50 py-3 sm:py-4 h-full">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 px-3 sm:px-6">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-[#FF512F]/15 to-[#FF7A00]/15 border border-[#FF512F]/20 rounded-full flex items-center justify-center font-bold text-[#FF512F] shrink-0 text-[10px] sm:text-sm shadow-2xs group-hover:from-[#FF512F]/25 group-hover:to-[#FF7A00]/25 transition-all">
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

                        {hasScreening && (
                            <div className="px-3 sm:px-6 pt-2.5 min-w-0">
                                <ScreeningAnswersList answers={candidate.screeningAnswers} />
                            </div>
                        )}

                        {sessionDetailLabel && (
                            <div className="px-3 sm:px-6 pt-2 min-w-0">
                                <p className="text-[10px] text-gray-400 font-medium truncate">
                                    {sessionDetailLabel}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Col 3 */}
                    <div className="px-3 sm:px-6 border-r border-gray-200/50 flex pt-3 sm:pt-4 pb-3 sm:pb-4 h-full">
                        <div className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap pt-2.5">
                            {joinedLabel}
                        </div>
                    </div>

                    {/* Col 4 */}
                    <div className="px-3 sm:px-6 flex pt-3 sm:pt-4 pb-3 sm:pb-4 h-full">
                        <div className="pt-1.5">{statusAction}</div>
                    </div>
                </div>
            </td>
        </tr>
    );
}
