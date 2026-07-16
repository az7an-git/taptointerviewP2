import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    X,
    CheckCircle,
    HelpCircle,
    XCircle,
    ClipboardList,
    Info,
    Star,
} from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";
import type { JobApplicant, QueueEntryOutcome, SaveOutcomePayload } from "@/types/job";
import {
    getParticipantDisplayName,
    QUEUE_OUTCOME_LABELS,
} from "../../utils/queueEntryStatus";
import { PendingOutcomeBannerSkeleton } from "./queuePanelSkeletons";

const OUTCOME_OPTIONS: {
    value: QueueEntryOutcome;
    icon: typeof CheckCircle;
}[] = [
        { value: "hired", icon: CheckCircle },
        { value: "follow_up", icon: HelpCircle },
        { value: "not_a_fit", icon: XCircle },
    ];

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

interface InterviewOutcomeModalProps {
    isOpen: boolean;
    candidate: JobApplicant;
    isSaving: boolean;
    onClose: () => void;
    onConfirm: (payload: SaveOutcomePayload) => void;
}

export function InterviewOutcomeModal({
    isOpen,
    candidate,
    isSaving,
    onClose,
    onConfirm,
}: InterviewOutcomeModalProps) {
    const [selected, setSelected] = useState<QueueEntryOutcome | null>(null);
    const [rating, setRating] = useState<number | null>(null);
    const [internalNotes, setInternalNotes] = useState("");

    const name = getParticipantDisplayName(candidate.participant);

    useEffect(() => {
        if (isOpen) {
            setSelected(null);
            setRating(null);
            setInternalNotes("");
        }
    }, [isOpen]);

    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selected) return;
        onConfirm({
            outcome: selected,
            rating,
            internal_notes: internalNotes.trim() || null,
        });
    };

    const modalContent = (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSaving) onClose();
            }}
        >
            <div
                className="bg-white w-full sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col min-w-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-1 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] shrink-0" />

                <div className="flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-gray-100 shrink-0">
                    <div className="min-w-0 flex-1 pr-2">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                            Record Outcome
                        </h2>
                        <p
                            className="text-xs sm:text-sm text-gray-500 font-medium mt-1 truncate"
                            title={name}
                        >
                            {name}
                        </p>

                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        aria-label="Close"
                        className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 shrink-0 touch-manipulation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 sm:px-3.5 sm:py-3">
                        <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Save an outcome to unlock Admit Next. &ldquo;Not a Fit&rdquo; candidates
                            cannot rejoin this job for 72 hours.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {isSaving ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4 animate-pulse"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                                            <div className="flex-1 space-y-2 pt-0.5">
                                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                                <div className="h-3 w-full max-w-xs bg-gray-100 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            OUTCOME_OPTIONS.map(({ value, icon: Icon }) => {
                                const { label, description } = QUEUE_OUTCOME_LABELS[value];
                                const isSelected = selected === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setSelected(value)}
                                        className={`w-full text-left rounded-xl border p-3.5 sm:p-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation ${isSelected
                                            ? "border-[#FF512F] bg-white ring-1 ring-[#FF512F]/30"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 active:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${isSelected
                                                    ? "bg-white border-[#FF512F]/20 text-[#FF512F]"
                                                    : "bg-gray-50 border-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-sm font-bold text-gray-900 break-words">
                                                        {label}
                                                    </span>
                                                    <span
                                                        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors mt-0.5 ${isSelected
                                                            ? "border-[#FF512F] bg-[#FF512F]"
                                                            : "border-gray-300 bg-white"
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {!isSaving && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Rating{" "}
                                    <span className="font-medium text-gray-400 normal-case">(optional)</span>
                                </label>
                                <div className="flex items-center gap-1.5">
                                    {RATING_OPTIONS.map((value) => {
                                        const isActive = rating !== null && value <= rating;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setRating(rating === value ? null : value)}
                                                className="p-1 rounded-md hover:bg-gray-50 transition-colors cursor-pointer touch-manipulation"
                                                aria-label={`Rate ${value} out of 5`}
                                            >
                                                <Star
                                                    className={`w-6 h-6 ${isActive
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="internal-notes"
                                    className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                                >
                                    Internal Notes{" "}
                                    <span className="font-medium text-gray-400 normal-case">(optional)</span>
                                </label>
                                <textarea
                                    id="internal-notes"
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value.slice(0, 5000))}
                                    rows={3}
                                    placeholder="Notes visible only to your team..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF512F]/30 focus:border-[#FF512F]/50 resize-y min-h-[72px]"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white flex flex-col gap-2.5 sm:flex-row sm:justify-end sm:gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 touch-manipulation min-h-[44px]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selected || isSaving}
                        className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation min-h-[44px]"
                    >
                        {isSaving ? (
                            <>
                                <Spinner className="w-4 h-4 border-2 border-white/30 border-t-white" />
                                Saving...
                            </>
                        ) : (
                            "Save Outcome"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

interface PendingOutcomeBannerProps {
    candidate: JobApplicant;
    isLoading?: boolean;
    onOpenModal: () => void;
}

export function PendingOutcomeBanner({
    candidate,
    isLoading = false,
    onOpenModal,
}: PendingOutcomeBannerProps) {
    if (isLoading) return <PendingOutcomeBannerSkeleton />;
    const name = getParticipantDisplayName(candidate.participant);

    return (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 mb-1 rounded-xl sm:rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden min-w-0">
            <div className="h-1 bg-gray-200" />
            <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Outcome Required
                            </span>
                        </div>
                        <h3
                            className="text-sm font-bold text-gray-900 truncate"
                            title={name}
                        >
                            {name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                            Interview complete. Record the outcome to call the next candidate.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onOpenModal}
                    className="w-full sm:w-auto sm:self-end bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white px-5 py-3 sm:py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm touch-manipulation min-h-[44px]"
                >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    Record Outcome
                </button>
            </div>
        </div>
    );
}
