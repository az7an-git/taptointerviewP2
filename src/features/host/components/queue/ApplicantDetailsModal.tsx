import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Clock,
  Star,
  FileText,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";
import { JobApplicant } from "@/types/job";
import { Spinner } from "@/common/ui/Spinner";
import { jobsApi } from "@/api/jobsApi";

interface ApplicantDetailsModalProps {
  jobId?: string;
  applicant: JobApplicant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantDetailsModal({
  jobId,
  applicant,
  isOpen,
  onClose,
}: ApplicantDetailsModalProps) {
  useBodyScrollLock(isOpen);

  const [detailedApplicant, setDetailedApplicant] = useState<JobApplicant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !applicant) {
      setDetailedApplicant(null);
      return;
    }

    setDetailedApplicant(applicant);

    if (!jobId) return;

    setIsLoading(true);
    let active = true;

    jobsApi
      .getParticipantDetails(jobId, applicant.participant.id)
      .then((res) => {
        if (active && res.data) {
          setDetailedApplicant(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch participant details:", err);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, applicant?.participant?.id, jobId]);

  if (!isOpen || !applicant) return null;

  const currentApplicant = detailedApplicant || applicant;

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "declined" || s === "removed") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (s === "admitted" || s === "confirmed" || s === "hired") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s === "waiting" || s === "called" || s === "in_session" || s === "follow_up" || s === "pending_outcome") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getOutcomeLabel = (outcome: string | null) => {
    if (!outcome) return "N/A";
    const o = outcome.toLowerCase();
    if (o === "hired") return "Hired";
    if (o === "follow_up") return "Follow Up";
    if (o === "not_a_fit") return "Not a Fit";
    return outcome;
  };

  const getOutcomeBadgeClass = (outcome: string | null) => {
    if (!outcome) return "bg-gray-50 text-gray-700 border-gray-200";
    const o = outcome.toLowerCase();
    if (o === "not_a_fit") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (o === "hired") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (o === "follow_up") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const renderStars = (rating: number | null) => {
    if (rating === null || rating === undefined) return <span className="text-gray-400 font-medium text-xs">No rating</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
              }`}
          />
        ))}
      </div>
    );
  };

  const name = `${currentApplicant.participant.firstName || ""} ${currentApplicant.participant.lastName || ""}`.trim() || "Unknown Candidate";
  const initials = ((currentApplicant.participant.firstName?.[0] || "") + (currentApplicant.participant.lastName?.[0] || "")).toUpperCase() || "?";

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] animate-fade-in p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-2xl sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-scale-up max-h-[92dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF512F] to-[#FF7A00] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 truncate">{name}</h2>
              {isLoading && <Spinner className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 scrollbar-brand [scrollbar-gutter:stable]">

          {/* Basic Details & Participant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Participant Profile
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-start text-xs gap-4">
                  <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    Email:
                  </span>
                  <a href={`mailto:${currentApplicant.participant.email}`} className="text-[#FF512F] hover:underline font-bold break-all text-right">
                    {currentApplicant.participant.email}
                  </a>
                </div>
                <div className="flex justify-between items-start text-xs gap-4">
                  <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    Phone:
                  </span>
                  <span className="text-gray-700 font-bold break-all text-right">
                    {currentApplicant.participant.phone || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Queue & Interview Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Queue Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(currentApplicant.status)}`}>
                    {currentApplicant.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Interview Outcome:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOutcomeBadgeClass(currentApplicant.outcome)}`}>
                    {getOutcomeLabel(currentApplicant.outcome)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Rating:</span>
                  {renderStars(currentApplicant.rating)}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Schedule */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Event Timeline
            </h3>
            <div className="text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Duration:</span>
                <span className="text-gray-700 font-bold">{formatDuration(currentApplicant.sessionDurationSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Internal Notes
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-150 min-h-[60px] whitespace-pre-wrap break-words">
              {currentApplicant.internalNotes || "No notes captured for this candidate yet."}
            </p>
          </div>

          {/* Screening Questions Answers if any */}
          {currentApplicant.screeningAnswers && currentApplicant.screeningAnswers.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 animate-fade-in">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Screening Answers
              </h3>
              <div className="space-y-3">
                {currentApplicant.screeningAnswers.map((ans, idx) => (
                  <div key={ans.questionId || idx} className="bg-white p-3 rounded-lg border border-gray-150 text-xs break-words">
                    <div className="grid grid-cols-[1.25rem_1fr] gap-x-2 gap-y-2 items-baseline">
                      <span className="font-medium text-gray-500 leading-snug">Q:</span>
                      <p className="m-0 font-normal text-gray-800 leading-snug break-words min-w-0">
                        {ans.question}
                      </p>
                      <span className="font-medium text-gray-500 leading-snug">A:</span>
                      <span className="font-normal text-gray-800 leading-snug break-words min-w-0">
                        {ans.selectedOptionText}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] rounded-lg transition-all shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
