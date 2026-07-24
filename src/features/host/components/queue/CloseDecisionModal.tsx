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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-[9999] p-4 transition-all duration-300 ease-out"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div
                className="bg-white w-full sm:max-w-[500px] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col min-w-0 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 shrink-0">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
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
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0 touch-manipulation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0">
                    {waitingCount > 0 && (
                        <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-orange-50/50 border border-orange-100 p-3 sm:p-4">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm text-orange-900 font-medium leading-relaxed">
                                <span className="font-bold text-orange-950">{waitingCount} candidate{waitingCount === 1 ? "" : "s"}</span> {waitingCount === 1 ? "is" : "are"} still waiting in the queue.
                                {activeInterviews > 0 && (
                                    <span className="block mt-1 text-slate-500">
                                        ({activeInterviews} ongoing interview session will continue).
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {/* Option 1: Continue Interviewing */}
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setSelectedDecision("continue")}
                            className={`w-full text-left rounded-xl p-3 sm:p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden ${selectedDecision === "continue"
                                ? "bg-orange-50/30 ring-2 ring-inset ring-[#FF512F]"
                                : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50/50"
                                }`}
                        >
                            <div className="flex items-start gap-3 relative z-10">
                                <div
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedDecision === "continue"
                                        ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white shadow-sm"
                                        : "bg-slate-50 border border-slate-100 text-slate-400"
                                        }`}
                                >
                                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-bold transition-colors ${selectedDecision === "continue" ? "text-gray-900" : "text-gray-700"}`}>
                                            Continue Interviewing
                                        </span>
                                        <span
                                            className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all duration-200 ${selectedDecision === "continue"
                                                ? "border-[#FF512F] bg-[#FF512F]"
                                                : "border-slate-300 bg-transparent"
                                                }`}
                                        >
                                            {selectedDecision === "continue" && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in" />
                                            )}
                                        </span>
                                    </div>
                                    <p className={`text-xs font-medium mt-1 leading-relaxed transition-colors ${selectedDecision === "continue" ? "text-slate-600" : "text-slate-500"}`}>
                                        Keep candidates in the queue so you can finish interviewing them. New joiners remain blocked.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Release Remaining Candidates */}
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setSelectedDecision("release")}
                            className={`w-full text-left rounded-xl p-3 sm:p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden ${selectedDecision === "release"
                                ? "bg-orange-50/30 ring-2 ring-inset ring-[#FF512F]"
                                : "bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50/50"
                                }`}
                        >
                            <div className="flex items-start gap-3 relative z-10">
                                <div
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectedDecision === "release"
                                        ? "bg-gradient-to-br from-[#FF512F] to-[#FF7A00] text-white shadow-sm"
                                        : "bg-slate-50 border border-slate-100 text-slate-400"
                                        }`}
                                >
                                    <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm font-bold transition-colors ${selectedDecision === "release" ? "text-gray-900" : "text-gray-700"}`}>
                                            Release Remaining
                                        </span>
                                        <span
                                            className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all duration-200 ${selectedDecision === "release"
                                                ? "border-[#FF512F] bg-[#FF512F]"
                                                : "border-slate-300 bg-transparent"
                                                }`}
                                        >
                                            {selectedDecision === "release" && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in" />
                                            )}
                                        </span>
                                    </div>
                                    <p className={`text-xs font-medium mt-1 leading-relaxed transition-colors ${selectedDecision === "release" ? "text-slate-600" : "text-slate-500"}`}>
                                        Notify candidates via SMS/Email with details and release them from the queue.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50 touch-manipulation"
                    >
                        Decide Later
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer touch-manipulation bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner className="w-4 h-4 border-2 border-slate-300 border-t-white" />
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
