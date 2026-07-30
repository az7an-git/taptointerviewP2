import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, XCircle, Clock, User, MessageSquare } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";
import type { WindowRequest } from "@/types/job";

interface WindowRequestsInboxModalProps {
    isOpen: boolean;
    requests: WindowRequest[];
    isLoading?: boolean;
    processingRequestId?: string | null;
    onClose: () => void;
    onReviewRequest: (
        requestId: string,
        action: "approve" | "decline",
        extendMinutesOverride?: number
    ) => void;
}

const CUSTOM_MINUTES_OPTIONS = [15, 30, 60, 120] as const;

export function WindowRequestsInboxModal({
    isOpen,
    requests,
    isLoading = false,
    processingRequestId = null,
    onClose,
    onReviewRequest,
}: WindowRequestsInboxModalProps) {
    const [selectedMinutesOverride, setSelectedMinutesOverride] = useState<Record<string, number>>({});

    useBodyScrollLock(isOpen);

    const pendingRequests = requests.filter((r) => r.status === "pending");

    useEffect(() => {
        if (isOpen && pendingRequests.length === 0) {
            onClose();
        }
    }, [isOpen, pendingRequests.length, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !processingRequestId) onClose();
            }}
        >
            <div
                className="bg-white w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col min-w-0 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-1 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] shrink-0" />

                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-100 shrink-0 gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                                Recruiter Window Requests
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-[#FF512F] border border-orange-200 shrink-0 whitespace-nowrap">
                                {pendingRequests.length} pending
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Review and act on window extension/close requests from your team
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={Boolean(processingRequestId)}
                        className="p-1.5 -mr-1.5 -mt-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <Spinner className="w-6 h-6 border-2 border-gray-300 border-t-[#FF512F]" />
                            <p className="text-xs text-gray-500 font-medium">Loading requests...</p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="py-12 text-center">
                            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-700">No Pending Requests</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                There are no open window requests from recruiters at this time.
                            </p>
                        </div>
                    ) : (
                        pendingRequests.map((req) => {
                            const isProcessing = processingRequestId === req.id;
                            const requesterName = req.requester
                                ? `${req.requester.first_name || ""} ${req.requester.last_name || ""}`.trim() || req.requester.email
                                : "Recruiter";
                            const minutes = selectedMinutesOverride[req.id] ?? (req.extend_minutes || 30);

                            return (
                                <div
                                    key={req.id}
                                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-[#FF512F]">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                    {requesterName}
                                                </h4>
                                                <span className="text-[10px] font-semibold text-gray-400">
                                                    {req.created_at && !isNaN(Date.parse(req.created_at))
                                                        ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : "Just now"}
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className={`w-fit px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border ${req.request_type === "extend"
                                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                                : "bg-red-50 text-red-700 border-red-200"
                                                }`}
                                        >
                                            {req.request_type === "extend"
                                                ? `Extend Request (+${req.extend_minutes || 30}m)`
                                                : "Early Close Request"}
                                        </span>
                                    </div>

                                    {req.note && (
                                        <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 border border-gray-100 text-xs text-gray-600 font-medium">
                                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                            <p className="italic">{req.note}</p>
                                        </div>
                                    )}

                                    {req.request_type === "extend" && (
                                        <div className="space-y-1 pt-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                Select Extension Duration:
                                            </label>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {CUSTOM_MINUTES_OPTIONS.map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        disabled={isProcessing}
                                                        onClick={() =>
                                                            setSelectedMinutesOverride((prev) => ({
                                                                ...prev,
                                                                [req.id]: m,
                                                            }))
                                                        }
                                                        className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${minutes === m
                                                            ? "bg-gray-900 text-white border-gray-900"
                                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        +{m >= 60 ? `${m / 60}h` : `${m}m`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-stretch justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            disabled={Boolean(processingRequestId)}
                                            onClick={() => onReviewRequest(req.id, "decline")}
                                            className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <Spinner className="w-3 h-3 border-2 border-gray-400 border-t-transparent" />
                                            ) : (
                                                <XCircle className="w-3.5 h-3.5 text-gray-500" />
                                            )}
                                            Decline
                                        </button>
                                        <button
                                            type="button"
                                            disabled={Boolean(processingRequestId)}
                                            onClick={() => onReviewRequest(req.id, "approve", minutes)}
                                            className="flex-1 sm:flex-none justify-center px-4 py-2 sm:py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <Spinner className="w-3 h-3 border-2 border-white/30 border-t-white" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                            Approve {req.request_type === "extend" ? `(+${minutes}m)` : ""}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
