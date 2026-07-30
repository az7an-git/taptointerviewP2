import { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, ShieldCheck, UserX } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";

interface CloseDecisionModalProps {
    isOpen: boolean;
    waitingCount: number;
    activeInterviews?: number;
    isSubmitting?: boolean;
    onClose: () => void;
    onConfirmDecision: (decision: "continue" | "release") => void;
}

export function CloseDecisionModal({
    isOpen,
    waitingCount,
    activeInterviews = 0,
    isSubmitting = false,
    onClose,
    onConfirmDecision,
}: CloseDecisionModalProps) {
    const [selectedDecision, setSelectedDecision] = useState<"continue" | "release">("continue");

    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirmDecision(selectedDecision);
    };

    const modalContent = (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 transition-all duration-300 ease-out"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div
                className="bg-white w-full sm:max-w-[500px] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 shrink-0 border-b border-slate-50 sm:border-none">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight">
                            Window Ended
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                            New applicant entries are now blocked.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="p-1 sm:p-2 -mr-1 sm:-mr-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0 touch-manipulation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="px-4 sm:px-6 py-2 sm:py-0 sm:pb-6 space-y-2 sm:space-y-5 overflow-y-auto flex-1 min-h-0">
                    {waitingCount > 0 && (
                        <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-orange-50/50 border border-orange-100 p-2 sm:p-4">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm text-orange-900 font-medium leading-tight sm:leading-relaxed">
                                <span className="font-bold text-orange-950">{waitingCount} candidate{waitingCount === 1 ? "" : "s"}</span> {waitingCount === 1 ? "is" : "are"} still waiting in the queue.
                                {activeInterviews > 0 && (
                                    <span className="block mt-0.5 text-slate-500">
                                        ({activeInterviews} ongoing interview session will continue).
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-1 landscape:grid-cols-2 sm:landscape:grid-cols-1 gap-2 sm:gap-3">
                        {/* Option 1: Continue Interviewing */}
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setSelectedDecision("continue")}
                            className={`w-full text-left rounded-xl p-2.5 sm:p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden ${selectedDecision === "continue"
                                ? "bg-orange-50/30 ring-2 ring-inset ring-[#FF512F]"
                                : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50/50"
                                }`}
                        >
                            <div className="flex items-start gap-2.5 sm:gap-3 relative z-10">
                                <div
                                    className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedDecision === "continue"
                                        ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white shadow-sm"
                                        : "bg-slate-50 border border-slate-100 text-slate-400"
                                        }`}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span className={`text-xs sm:text-sm font-bold transition-colors ${selectedDecision === "continue" ? "text-gray-900" : "text-gray-700"}`}>
                                            Continue Interviewing
                                        </span>
                                        <span
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shrink-0 flex items-center justify-center transition-all duration-200 ${selectedDecision === "continue"
                                                ? "border-[#FF512F] bg-[#FF512F]"
                                                : "border-slate-300 bg-transparent"
                                                }`}
                                        >
                                            {selectedDecision === "continue" && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in" />
                                            )}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] sm:text-xs font-medium mt-0.5 leading-snug sm:leading-relaxed transition-colors ${selectedDecision === "continue" ? "text-slate-600" : "text-slate-500"}`}>
                                        Keep candidates in queue to finish.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Release Remaining Candidates */}
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setSelectedDecision("release")}
                            className={`w-full text-left rounded-xl p-2.5 sm:p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden ${selectedDecision === "release"
                                ? "bg-orange-50/30 ring-2 ring-inset ring-[#FF512F]"
                                : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50/50"
                                }`}
                        >
                            <div className="flex items-start gap-2.5 sm:gap-3 relative z-10">
                                <div
                                    className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedDecision === "release"
                                        ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white shadow-sm"
                                        : "bg-slate-50 border border-slate-100 text-slate-400"
                                        }`}
                                >
                                    <UserX className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span className={`text-xs sm:text-sm font-bold transition-colors ${selectedDecision === "release" ? "text-gray-900" : "text-gray-700"}`}>
                                            Release Remaining
                                        </span>
                                        <span
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shrink-0 flex items-center justify-center transition-all duration-200 ${selectedDecision === "release"
                                                ? "border-[#FF512F] bg-[#FF512F]"
                                                : "border-slate-300 bg-transparent"
                                                }`}
                                        >
                                            {selectedDecision === "release" && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in" />
                                            )}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] sm:text-xs font-medium mt-0.5 leading-snug sm:leading-relaxed transition-colors ${selectedDecision === "release" ? "text-slate-600" : "text-slate-500"}`}>
                                        Notify and release candidates.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-3 sm:py-5 bg-white border-t border-slate-100 flex flex-row items-center justify-end gap-2.5 sm:gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-1/2 sm:w-auto px-4 sm:px-5 h-11 sm:h-11 text-xs sm:text-sm font-bold text-gray-700 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/60 rounded-xl transition-all cursor-pointer disabled:opacity-50 touch-manipulation flex items-center justify-center text-center leading-none"
                    >
                        Decide Later
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-1/2 sm:w-auto px-4 sm:px-6 h-11 sm:h-11 text-xs sm:text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer touch-manipulation bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-center leading-none"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white" />
                                Processing...
                            </>
                        ) : selectedDecision === "continue" ? (
                            <>Confirm & Continue</>
                        ) : (
                            <>Confirm & Release</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
