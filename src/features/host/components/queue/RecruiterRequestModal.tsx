import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, Clock, XCircle } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";
import type { WindowRequestType } from "@/types/job";

interface RecruiterRequestModalProps {
    isOpen: boolean;
    windowId: string;
    defaultType?: WindowRequestType;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmitRequest: (payload: {
        window_id: string;
        request_type: WindowRequestType;
        extend_minutes?: number;
        note?: string;
    }) => void;
}

const EXTENSION_OPTIONS = [15, 30, 60, 120] as const;

export function RecruiterRequestModal({
    isOpen,
    windowId,
    defaultType = "extend",
    isSubmitting = false,
    onClose,
    onSubmitRequest,
}: RecruiterRequestModalProps) {
    const [requestType, setRequestType] = useState<WindowRequestType>(defaultType);
    const [extendMinutes, setExtendMinutes] = useState<number>(30);
    const [note, setNote] = useState("");

    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmitRequest({
            window_id: windowId,
            request_type: requestType,
            extend_minutes: requestType === "extend" ? extendMinutes : undefined,
            note: note.trim() || undefined,
        });
    };

    const modalContent = (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose();
            }}
        >
            <div
                className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col min-w-0 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-1 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] shrink-0" />

                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">
                            Submit Window Request
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Notify administrators for approval
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Request Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setRequestType("extend")}
                                className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${requestType === "extend"
                                    ? "border-[#FF512F] bg-orange-50/50 text-[#FF512F] ring-1 ring-[#FF512F]/30"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                Request Extension
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setRequestType("early_close")}
                                className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${requestType === "early_close"
                                    ? "border-red-500 bg-red-50/50 text-red-600 ring-1 ring-red-500/30"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <XCircle className="w-4 h-4" />
                                Request Early Close
                            </button>
                        </div>
                    </div>

                    {requestType === "extend" && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Extension Duration
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {EXTENSION_OPTIONS.map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setExtendMinutes(mins)}
                                        className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${extendMinutes === mins
                                            ? "border-[#FF512F] bg-[#FF512F] text-white"
                                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        +{mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="request-note" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Note for Admin <span className="font-normal text-gray-400 normal-case">(optional)</span>
                        </label>
                        <textarea
                            id="request-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value.slice(0, 300))}
                            rows={3}
                            placeholder="e.g., Candidates waiting, running behind schedule..."
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF512F]/30 focus:border-[#FF512F]/50"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="w-3.5 h-3.5 border-2 border-white/30 border-t-white" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" />
                                    Send Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
