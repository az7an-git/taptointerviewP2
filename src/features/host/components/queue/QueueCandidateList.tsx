import type { JobApplicant, QueueEntryStatus } from "@/types/job";
import type { SessionAction } from "../../hooks/useQueueCardSession";
import { QueueCandidateEntry } from "./QueueCandidateEntry";
import { QueueEmptyState } from "./QueueEmptyState";

interface QueueCandidateListProps {
    candidates: JobApplicant[];
    nextCandidateId?: string;
    sessionCandidateId?: string;
    sessionStatus: QueueEntryStatus | null;
    sessionAction: SessionAction;
    onStartInterview: () => void;
    onWindowExpired: () => void;
    onViewDetails?: (candidate: JobApplicant) => void;
}

function buildEntryProps(
    candidate: JobApplicant,
    index: number,
    ctx: QueueCandidateListProps
) {
    const isSessionCandidate =
        ctx.sessionCandidateId === candidate.queueEntryId;
    const canStart =
        isSessionCandidate &&
        (ctx.sessionStatus === "admitted" || ctx.sessionStatus === "confirmed");

    return {
        candidate,
        index,
        isNext: ctx.nextCandidateId === candidate.queueEntryId,
        isActiveSession: isSessionCandidate,
        isStartingInterview:
            ctx.sessionAction === "start" && isSessionCandidate,
        onStartInterview: canStart ? ctx.onStartInterview : undefined,
        onWindowExpired: ctx.onWindowExpired,
        onViewDetails: ctx.onViewDetails,
    };
}

export function QueueCandidateList(props: QueueCandidateListProps) {
    const { candidates } = props;
    const isEmpty = candidates.length === 0;

    return (
        <>
            <div className="sm:hidden divide-y divide-gray-200 bg-white overflow-y-auto max-h-[650px] scrollbar-brand">
                {isEmpty ? (
                    <QueueEmptyState variant="mobile" />
                ) : (
                    candidates.map((candidate, index) => (
                        <QueueCandidateEntry
                            key={candidate.queueEntryId}
                            variant="mobile"
                            {...buildEntryProps(candidate, index, props)}
                        />
                    ))
                )}
            </div>

            <div className="hidden sm:block overflow-y-auto max-h-[650px] bg-white scrollbar-brand">
                <table className="w-full table-fixed text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-white shadow-sm">
                        <tr className="border-b border-gray-200 bg-white text-[10px] sm:text-xs uppercase tracking-wider text-gray-500">
                            <th className="hidden sm:table-cell px-4 sm:px-6 py-3 font-bold whitespace-nowrap w-12">
                                #
                            </th>
                            <th className="px-3 sm:px-6 py-3 font-bold whitespace-nowrap">
                                Participant
                            </th>
                            <th className="px-3 sm:px-6 py-3 font-bold whitespace-nowrap w-32">
                                Joined
                            </th>
                            <th className="px-3 sm:px-6 py-3 font-bold whitespace-nowrap w-[180px]">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-sm [&_td]:align-top [&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-gray-200">
                        {isEmpty ? (
                            <QueueEmptyState variant="table" />
                        ) : (
                            candidates.map((candidate, index) => (
                                <QueueCandidateEntry
                                    key={candidate.queueEntryId}
                                    variant="table"
                                    {...buildEntryProps(candidate, index, props)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
