import { Clock, AlertTriangle, Plus, XCircle } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";

interface WindowClosingWarningBannerProps {
    minutesRemaining: number;
    waitingCount: number;
    jobTitle?: string;
    layout?: "card" | "bar";
    isAdmin?: boolean;
    isActionLoading?: boolean;
    onExtend?: (minutes: number) => void;
    onCloseEarly?: () => void;
    onRequestExtension?: () => void;
    onRequestEarlyClose?: () => void;
}

export function WindowClosingWarningBanner({
    minutesRemaining,
    waitingCount,
    jobTitle,
    layout = "card",
    isAdmin = true,
    isActionLoading = false,
    onExtend,
    onCloseEarly,
    onRequestExtension,
    onRequestEarlyClose,
}: WindowClosingWarningBannerProps) {
    if (layout === "bar") {
        return (
            <div className="w-full bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-500/10 border-b border-amber-200/80 px-4 py-2 sm:py-2.5 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-amber-200/80 flex items-center justify-center shrink-0 text-amber-900 shadow-2xs">
                        <Clock className="w-4 h-4 animate-pulse text-amber-800" />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-extrabold text-amber-950 uppercase tracking-wider text-[10px] bg-amber-200/90 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-800" /> Window Closing
                        </span>
                        {jobTitle && (
                            <span
                                title={jobTitle}
                                className="font-bold text-gray-900 truncate inline-block max-w-[160px] sm:max-w-[240px] md:max-w-[320px] align-bottom"
                            >
                                {jobTitle}
                            </span>
                        )}
                        <span className="text-amber-900 font-medium">
                            &bull; ~{minutesRemaining} min{minutesRemaining === 1 ? "" : "s"} left ({waitingCount} candidate{waitingCount === 1 ? "" : "s"} in queue)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {isAdmin ? (
                        <>
                            <div className="flex items-center rounded-lg bg-white/80 border border-amber-200/80 p-0.5 shadow-2xs">
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => onExtend?.(15)}
                                    className="px-2.5 py-1 rounded hover:bg-amber-100 text-[#FF512F] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    {isActionLoading ? <Spinner className="w-3 h-3 border-2 border-[#FF512F]/30 border-t-[#FF512F]" /> : <Plus className="w-3 h-3" />}
                                    +15m
                                </button>
                                <div className="w-[1px] h-3 bg-amber-200 mx-0.5" />
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => onExtend?.(30)}
                                    className="px-2.5 py-1 rounded hover:bg-amber-100 text-[#FF512F] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    {isActionLoading ? <Spinner className="w-3 h-3 border-2 border-[#FF512F]/30 border-t-[#FF512F]" /> : <Plus className="w-3 h-3" />}
                                    +30m
                                </button>
                            </div>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onCloseEarly?.()}
                                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                                <XCircle className="w-3 h-3 text-red-500" />
                                Close Early
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => (onRequestExtension || onRequestEarlyClose)?.()}
                            className="px-3 py-1 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                            Options
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-3 sm:mx-4 mt-3 mb-2 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/40 p-4 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/80 border-none flex items-center justify-center shrink-0 text-amber-700 mt-1 xl:mt-0 shadow-2xs">
                        <Clock className="w-5 h-5 animate-pulse text-amber-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-amber-800" /> Window Closing Soon
                            </span>
                            {jobTitle && (
                                <span
                                    title={jobTitle}
                                    className="text-xs font-bold text-gray-900 truncate inline-block max-w-[200px] sm:max-w-[300px] align-bottom"
                                >
                                    {jobTitle}
                                </span>
                            )}
                            <span className="text-xs font-bold text-amber-950 whitespace-nowrap">
                                ~{minutesRemaining} min{minutesRemaining === 1 ? "" : "s"} left
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-800/90 font-semibold leading-relaxed">
                            Interview window ends in about {minutesRemaining} minute{minutesRemaining === 1 ? "" : "s"}.{" "}
                            <span className="text-amber-950 font-bold">
                                {waitingCount} candidate{waitingCount === 1 ? "" : "s"}
                            </span>{" "}
                            {waitingCount === 1 ? "remains" : "remain"} in queue.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto shrink-0 mt-1 xl:mt-0">
                    {isAdmin ? (
                        <>
                            <div className="flex items-center rounded-lg bg-orange-50 border border-orange-200/60 p-0.5 w-full sm:w-auto">
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => onExtend?.(15)}
                                    className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-md hover:bg-orange-200/50 text-[#FF512F] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                                >
                                    {isActionLoading ? (
                                        <Spinner className="w-3.5 h-3.5 border-2 border-[#FF512F]/30 border-t-[#FF512F]" />
                                    ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                    )}
                                    +15m
                                </button>
                                <div className="w-[1px] h-4 bg-orange-200/70 mx-0.5 shrink-0 rounded-full" />
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => onExtend?.(30)}
                                    className="flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-md hover:bg-orange-200/50 text-[#FF512F] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                                >
                                    {isActionLoading ? (
                                        <Spinner className="w-3.5 h-3.5 border-2 border-[#FF512F]/30 border-t-[#FF512F]" />
                                    ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                    )}
                                    +30m
                                </button>
                            </div>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onCloseEarly?.()}
                                className="w-full sm:w-auto justify-center px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation shadow-sm"
                            >
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                Close Early
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => (onRequestExtension || onRequestEarlyClose)?.()}
                            className="w-full sm:w-auto justify-center px-3 py-2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                        >
                            Options
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
