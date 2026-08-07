import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import type { QueueEntryOutcome } from "@/types/job";
import { QUEUE_OUTCOME_LABELS, normalizeQueueStatus } from "../../utils/queueEntryStatus";

type StatusStyle = {
    dot: string;
    label: string;
    bgClass: string;
    borderClass: string;
};

function getStatusStyle(
    status: string,
    isWindowExpired: boolean,
    outcome?: QueueEntryOutcome | null
): StatusStyle {
    const s = normalizeQueueStatus(status);

    if (s === "called") {
        return isWindowExpired
            ? {
                dot: "bg-amber-400",
                label: "text-amber-700",
                bgClass: "bg-amber-50",
                borderClass: "border-amber-200",
            }
            : {
                dot: "bg-blue-500 animate-pulse",
                label: "text-gray-700",
                bgClass: "bg-white",
                borderClass: "border-gray-200",
            };
    }
    if (s === "waiting")
        return {
            dot: "bg-amber-400",
            label: "text-gray-600",
            bgClass: "bg-white",
            borderClass: "border-gray-200",
        };
    if (s === "admitted" || s === "confirmed")
        return {
            dot: "bg-emerald-500",
            label: "text-emerald-700",
            bgClass: "bg-emerald-50",
            borderClass: "border-emerald-200",
        };
    if (s === "in_session")
        return {
            dot: "bg-orange-500 animate-pulse",
            label: "text-orange-700",
            bgClass: "bg-orange-50",
            borderClass: "border-orange-200",
        };
    if (s === "pending_outcome")
        return {
            dot: "bg-gray-500",
            label: "text-gray-700",
            bgClass: "bg-gray-100",
            borderClass: "border-gray-300",
        };
    if (s === "resolved" && outcome) {
        if (outcome === "hired")
            return {
                dot: "bg-emerald-500",
                label: "text-emerald-700",
                bgClass: "bg-emerald-50",
                borderClass: "border-emerald-200",
            };
        if (outcome === "follow_up")
            return {
                dot: "bg-yellow-400",
                label: "text-yellow-700",
                bgClass: "bg-yellow-50",
                borderClass: "border-yellow-200",
            };
        if (outcome === "not_a_fit")
            return {
                dot: "bg-red-400",
                label: "text-red-600",
                bgClass: "bg-red-50",
                borderClass: "border-red-200",
            };
    }
    if (s === "resolved")
        return {
            dot: "bg-gray-400",
            label: "text-gray-500",
            bgClass: "bg-gray-50 opacity-80",
            borderClass: "border-gray-200",
        };
    if (s === "declined" || s === "removed")
        return {
            dot: "bg-red-400",
            label: "text-gray-600",
            bgClass: "bg-white",
            borderClass: "border-gray-200",
        };
    return {
        dot: "bg-gray-300",
        label: "text-gray-500",
        bgClass: "bg-white",
        borderClass: "border-gray-200",
    };
}

function getStatusLabel(
    status: string,
    isWindowExpired: boolean,
    outcome?: QueueEntryOutcome | null
): string {
    const s = normalizeQueueStatus(status);
    if (s === "called") return isWindowExpired ? "expiring" : "Calling";
    if (s === "in_session") return "In session";
    if (s === "pending_outcome") return "Pick outcome";
    if (s === "resolved" && outcome) {
        return QUEUE_OUTCOME_LABELS[outcome]?.label ?? outcome;
    }
    return s.replace(/_/g, " ");
}

export function QueueStatusBadge({
    status,
    isWindowExpired,
    secondsLeft,
    outcome,
}: {
    status: string;
    isWindowExpired: boolean;
    secondsLeft: number | null;
    outcome?: QueueEntryOutcome | null;
}) {
    const normalizedStatus = normalizeQueueStatus(status);
    if (normalizedStatus === "resolved" && !outcome) {
        return null;
    }

    const { dot, label: labelClass, bgClass, borderClass } = getStatusStyle(status, isWindowExpired, outcome);
    const text = getStatusLabel(status, isWindowExpired, outcome);
    const isCalled = normalizedStatus === "called";

    return (
        <span
            className={`inline-flex flex-wrap items-center gap-1.5 px-2 py-1 rounded-md border ${borderClass} ${bgClass} text-[10px] font-semibold uppercase tracking-wide max-w-full ${labelClass}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
            {isCalled && isWindowExpired ? (
                <>
                    {text}
                    <Spinner className="w-3 h-3 border-2 border-amber-200 border-t-amber-500" />
                </>
            ) : isCalled && !isWindowExpired ? (
                <>
                    {text}
                    {secondsLeft != null && (
                        <span
                            className={`inline-flex items-center gap-0.5 tabular-nums normal-case font-bold ${secondsLeft <= 15 ? "text-red-500" : "text-blue-600"}`}
                        >
                            <Clock className="w-3 h-3" />
                            {secondsLeft}s
                        </span>
                    )}
                </>
            ) : (
                text
            )}
        </span>
    );
}

/** Outline pill */
export function QueueHintBadge({ children }: { children: ReactNode }) {
    return (
        <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border border-[#FF512F]/30 bg-[#FF512F]/10 text-[#FF512F]">
            {children}
        </span>
    );
}
