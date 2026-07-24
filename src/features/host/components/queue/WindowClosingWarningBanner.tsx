import { Clock, AlertTriangle, Plus, XCircle, Send } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";

interface WindowClosingWarningBannerProps {
    minutesRemaining: number;
    waitingCount: number;
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
    isAdmin = true,
    isActionLoading = false,
    onExtend,
    onCloseEarly,
    onRequestExtension,
    onRequestEarlyClose,
}: WindowClosingWarningBannerProps) {
    return (
        <div className="mx-3 sm:mx-4 mt-3 mb-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-700">
                        <Clock className="w-5 h-5 animate-pulse text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-700" /> Window Closing Soon
                            </span>
                            <span className="text-xs font-bold text-amber-700">
                                ~{minutesRemaining} min{minutesRemaining === 1 ? "" : "s"} left
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-800 font-semibold mt-1">
                            Interview window ends in about {minutesRemaining} minute{minutesRemaining === 1 ? "" : "s"}.{" "}
                            <span className="text-amber-900 font-bold">
                                {waitingCount} candidate{waitingCount === 1 ? "" : "s"}
                            </span>{" "}
                            remain in queue.
                        </p>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 shrink-0 self-end sm:self-center">
                    {isAdmin ? (
                        <>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onExtend?.(15)}
                                className="px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                            >
                                {isActionLoading ? (
                                    <Spinner className="w-3.5 h-3.5 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                +15m
                            </button>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onExtend?.(30)}
                                className="px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                            >
                                {isActionLoading ? (
                                    <Spinner className="w-3.5 h-3.5 border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                +30m
                            </button>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onCloseEarly?.()}
                                className="px-2 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                            >
                                <XCircle className="w-3.5 h-3.5 text-gray-300" />
                                Close Early
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onRequestExtension?.()}
                                className="px-2 py-2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Request More Time
                            </button>
                            <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => onRequestEarlyClose?.()}
                                className="px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                            >
                                Request Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
