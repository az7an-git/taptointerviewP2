import { createPortal } from "react-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    X,
    User,
    Mail,
    Phone,
    Clock,
    Star,
    FileText,
    HelpCircle,
    CheckCircle,
} from "lucide-react";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";
import { jobsApi } from "@/api/jobsApi";
import { PastApplicantDetail, PastApplicantItem } from "@/types/job";
import { toast } from "sonner";
import InterviewNotesList from "./InterviewNotesList";
import { getStatusColors, getOutcomeColors } from "../../utils/badgeColors";

interface PastApplicantDetailModalProps {
    jobId: string;
    queueEntryId: string | null;
    previewApplicant?: PastApplicantItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function PastApplicantDetailModal({
    jobId,
    queueEntryId,
    previewApplicant,
    isOpen,
    onClose,
}: PastApplicantDetailModalProps) {
    useBodyScrollLock(isOpen);

    const cacheRef = useRef<Record<string, PastApplicantDetail>>({});
    const [detail, setDetail] = useState<PastApplicantDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Synchronously compute active detail matching queueEntryId
    const currentDetail =
        queueEntryId && detail && (detail as any).queue_entry_id === queueEntryId
            ? detail
            : (queueEntryId && cacheRef.current[queueEntryId]) || null;

    const currentIsLoading = isLoading || (isOpen && !!queueEntryId && !currentDetail);

    useEffect(() => {
        if (!isOpen || !queueEntryId) {
            setDetail(null);
            setIsLoading(false);
            return;
        }

        if (cacheRef.current[queueEntryId]) {
            setDetail(cacheRef.current[queueEntryId]);
            setIsLoading(false);
            return;
        }

        let active = true;
        setIsLoading(true);
        setDetail(null);

        jobsApi
            .getPastApplicantDetail(jobId, queueEntryId)
            .then((res) => {
                if (active) {
                    const detailData = { ...res.data, queue_entry_id: queueEntryId };
                    setDetail(detailData);
                    cacheRef.current[queueEntryId] = detailData;
                }
            })
            .catch((err) => {
                console.error("Failed to load past applicant detail:", err);
                if (active) toast.error("Failed to load applicant details.");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [isOpen, queueEntryId, jobId]);

    const handleAddNote = useCallback(
        async (content: string) => {
            if (!queueEntryId || !currentDetail) return;
            try {
                const res = await jobsApi.addInterviewNote(jobId, queueEntryId, content);
                if (res.status === "fail") {
                    toast.error(res.data as unknown as string || "Failed to add note");
                    throw new Error(res.data as unknown as string);
                }
                toast.success("Note added.");
                const updatedDetail = {
                    ...currentDetail,
                    interview_notes: [res.data as any, ...(currentDetail.interview_notes || [])],
                };
                setDetail(updatedDetail);
                cacheRef.current[queueEntryId] = updatedDetail;
            } catch (error: any) {
                if (error.response?.data?.data) {
                    toast.error(error.response.data.data);
                } else if (error.message && error.message !== "[object Object]") {
                    // Already handled above or generic network error
                } else {
                    toast.error("Failed to add note");
                }
                throw error;
            }
        },
        [jobId, queueEntryId, currentDetail]
    );

    const handleEditNote = useCallback(
        async (noteId: string, content: string) => {
            if (!currentDetail || !queueEntryId) return;
            try {
                const res = await jobsApi.editInterviewNote(jobId, noteId, content);
                if (res.status === "fail") {
                    toast.error(res.data as unknown as string || "Failed to edit note");
                    throw new Error(res.data as unknown as string);
                }
                toast.success("Note updated.");
                const updatedDetail = {
                    ...currentDetail,
                    interview_notes: (currentDetail.interview_notes || []).map((n) =>
                        n.id === noteId ? (res.data as any) : n
                    ),
                };
                setDetail(updatedDetail);
                cacheRef.current[queueEntryId] = updatedDetail;
            } catch (error: any) {
                if (error.response?.data?.data) {
                    toast.error(error.response.data.data);
                } else if (error.message && error.message !== "[object Object]") {
                    // Already handled above or generic network error
                } else {
                    toast.error("Failed to edit note");
                }
                throw error;
            }
        },
        [jobId, currentDetail, queueEntryId]
    );

    if (!isOpen || !queueEntryId) return null;

    const formatDuration = (seconds: number | null | undefined) => {
        if (seconds === null || seconds === undefined) return "N/A";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getOutcomeLabel = (outcome: string | null) => {
        if (!outcome) return "N/A";
        const o = outcome.toLowerCase();
        if (o === "hired") return "Hired";
        if (o === "follow_up") return "Follow Up";
        if (o === "not_a_fit") return "Not a Fit";
        return outcome;
    };

    const renderStars = (rating: number | null) => {
        if (rating === null || rating === undefined) return <span className="text-gray-400 font-medium text-xs">No rating</span>;
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                ))}
            </div>
        );
    };

    const name = currentDetail
        ? `${currentDetail.participant?.first_name || ""} ${currentDetail.participant?.last_name || ""}`.trim() || "Unknown Candidate"
        : previewApplicant
            ? `${previewApplicant.participant?.first_name || ""} ${previewApplicant.participant?.last_name || ""}`.trim() || "Unknown Candidate"
            : "Applicant Details";

    const initials = currentDetail
        ? ((currentDetail.participant?.first_name?.[0] || "") + (currentDetail.participant?.last_name?.[0] || "")).toUpperCase() || "?"
        : previewApplicant
            ? ((previewApplicant.participant?.first_name?.[0] || "") + (previewApplicant.participant?.last_name?.[0] || "")).toUpperCase() || "?"
            : "?";

    return createPortal(
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] animate-fade-in p-0 sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white w-full sm:max-w-2xl sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up-bottom sm:animate-scale-up max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden pb-2">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF512F] to-[#FF7A00] rounded-full shrink-0 flex items-center justify-center font-bold text-white text-sm select-none shadow-xs">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-bold text-gray-900 truncate leading-snug" title={name}>{name}</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100/80 hover:bg-[#FF512F]/15 text-gray-400 hover:text-[#FF512F] flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6 scrollbar-brand [scrollbar-gutter:stable] mb-1">
                    {currentIsLoading || !currentDetail ? (
                        <div className="space-y-6 animate-pulse select-none py-2">
                            {/* Contact & Status Grid Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded-md w-36 mb-2" />
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-200 rounded-md w-14" />
                                            <div className="h-3.5 bg-gray-200 rounded-md w-36" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-200 rounded-md w-14" />
                                            <div className="h-3.5 bg-gray-200 rounded-md w-28" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded-md w-36 mb-2" />
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-200 rounded-md w-20" />
                                            <div className="h-5 bg-gray-200 rounded-full w-16" />
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="h-3 bg-gray-200 rounded-md w-24" />
                                            <div className="h-5 bg-gray-200 rounded-full w-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Timeline Skeleton */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="h-4 bg-gray-200 rounded-md w-28 mb-2" />
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <div className="h-3 bg-gray-200 rounded-md w-16" />
                                        <div className="h-3.5 bg-gray-200 rounded-md w-32" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="h-3 bg-gray-200 rounded-md w-16" />
                                        <div className="h-3.5 bg-gray-200 rounded-md w-32" />
                                    </div>
                                </div>
                            </div>

                            {/* Notes Skeleton */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="h-4 bg-gray-200 rounded-md w-32 mb-2" />
                                <div className="h-16 bg-gray-200/60 rounded-lg w-full" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Contact & Status Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-[#FF512F]" />
                                        Participant Profile
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start text-xs gap-4">
                                            <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-[#FF512F]" />
                                                Email:
                                            </span>
                                            <a
                                                href={`mailto:${currentDetail.participant?.email || ""}`}
                                                className="text-[#FF512F] hover:underline font-bold break-all text-right"
                                            >
                                                {currentDetail.participant?.email || "N/A"}
                                            </a>
                                        </div>
                                        <div className="flex justify-between items-start text-xs gap-4">
                                            <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-[#FF512F]" />
                                                Phone:
                                            </span>
                                            <span className="text-gray-700 font-bold break-all text-right">
                                                {currentDetail.participant?.phone || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5 text-[#FF512F]" />
                                        Queue & Interview Status
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-medium">Queue Status:</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColors(currentDetail.status)}`}
                                            >
                                                {currentDetail.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-medium">Interview Outcome:</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOutcomeColors(currentDetail.outcome || undefined)}`}
                                            >
                                                {getOutcomeLabel(currentDetail.outcome)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400 font-medium">Rating:</span>
                                            {renderStars(currentDetail.rating)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-[#FF512F]" />
                                    Event Timeline
                                </h3>
                                <div className="text-xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-medium">Joined:</span>
                                        <span className="text-gray-700 font-bold">
                                            {currentDetail.joined_at ? new Date(currentDetail.joined_at).toLocaleString() : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-medium">Called:</span>
                                        <span className="text-gray-700 font-bold">
                                            {currentDetail.called_at ? new Date(currentDetail.called_at).toLocaleString() : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-medium">Session Duration:</span>
                                        <span className="text-gray-700 font-bold">
                                            {formatDuration(currentDetail.session_duration_seconds)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Screening Answers (Versioned Snapshot) */}
                            {currentDetail.screening_answers && currentDetail.screening_answers.length > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 animate-fade-in">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5 text-[#FF512F]" />
                                        Screening Answers <span className="text-[#FF512F]">(Original Version)</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {currentDetail.screening_answers.map((ans, idx) => (
                                            <div
                                                key={ans.question_id || idx}
                                                className="bg-white p-3.5 rounded-xl border border-gray-200/80 text-xs break-words shadow-2xs"
                                            >
                                                <div className="grid grid-cols-[1.25rem_1fr] gap-x-2 gap-y-2 items-baseline">
                                                    <span className="font-semibold text-gray-500 leading-snug">Q:</span>
                                                    <p className="m-0 font-medium text-gray-800 leading-snug break-words min-w-0">
                                                        {ans.question}
                                                    </p>
                                                    <span className="font-semibold text-gray-500 leading-snug">A:</span>
                                                    <span className="font-medium text-gray-800 leading-snug break-words min-w-0">
                                                        {ans.selected_option_text || `Option #${ans.selected_option_index + 1}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Interview Notes */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-[#FF512F]" />
                                    Interview Notes <span className="text-[#FF512F]">({currentDetail.interview_notes?.length || 0})</span>
                                </h3>
                                <InterviewNotesList
                                    notes={currentDetail.interview_notes || []}
                                    onAddNote={handleAddNote}
                                    onEditNote={handleEditNote}
                                />
                            </div>
                        </>
                    )}
                </div>


            </div>
        </div>,
        document.body
    );
}
