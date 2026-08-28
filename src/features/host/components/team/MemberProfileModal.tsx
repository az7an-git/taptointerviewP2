import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Mail,
  Shield,
  ShieldCheck,
  Briefcase,
  User,
} from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";
import { displayNameFromUser } from "@/common/utils/userDisplayName";
import { Job } from "@/types/job";

interface MemberProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  is_active: boolean;
  role: string;
  job_ids?: string[];
}

interface MemberProfileModalProps {
  member: MemberProfile | null;
  jobs: Job[];
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (memberId: string, data: { role?: string; job_ids?: string[] }) => Promise<void>;
}

export function MemberProfileModal({
  member,
  jobs,
  isOpen,
  isSaving,
  onClose,
  onSave,
}: MemberProfileModalProps) {
  const [prevMemberId, setPrevMemberId] = useState<string | null>(null);
  const [role, setRole] = useState(() => member?.role ?? "interviewer");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>(() => member?.job_ids ?? []);

  // Synchronously compute active detail matching member.id during render pass before DOM paint (prevents layout jump)
  if (member && member.id !== prevMemberId) {
    setPrevMemberId(member.id);
    setRole(member.role ?? "interviewer");
    setSelectedJobIds(member.job_ids ?? []);
  }

  useBodyScrollLock(isOpen);

  if (!isOpen || !member) return null;

  const displayName = displayNameFromUser(member) || member.email;
  const initial = displayName.charAt(0).toUpperCase();

  const handleToggleJob = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobIds.length === jobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map((j) => j.id));
    }
  };

  const handleSave = async () => {
    const payload: { role?: string; job_ids?: string[] } = {};

    // Always send role (it may have changed)
    payload.role = role;

    // Only send job_ids if interviewer role
    if (role === "interviewer") {
      payload.job_ids = selectedJobIds;
    }

    await onSave(member.id, payload);
  };

  const hasChanges =
    role !== member.role ||
    (role === "interviewer" &&
      JSON.stringify([...(member.job_ids ?? [])].sort()) !==
      JSON.stringify([...selectedJobIds].sort()));

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-scale-up max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF512F]/20 to-[#FF7A00]/20 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[#FF512F] text-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">{displayName}</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 min-w-0">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate [overflow-wrap:anywhere]">{member.email}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 scrollbar-brand">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
            <span
              className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${member.is_active ? "bg-[#E8F6EF] text-[#10B981]" : "bg-amber-50 text-amber-600"
                }`}
            >
              {member.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("interviewer")}
                className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${role === "interviewer"
                  ? "border-[#FF512F] bg-gradient-to-r from-[#FF512F]/5 to-[#FF7A00]/5 text-[#FF512F] shadow-sm"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600 bg-white"
                  }`}
              >
                <ShieldCheck
                  className={`w-5 h-5 ${role === "interviewer" ? "text-[#FF512F]" : "text-gray-400"}`}
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">Interviewer</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium leading-tight">
                    Can view assigned jobs and qualify candidates.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-all ${role === "admin"
                  ? "border-[#FF512F] bg-gradient-to-r from-[#FF512F]/5 to-[#FF7A00]/5 text-[#FF512F] shadow-sm"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600 bg-white"
                  }`}
              >
                <Shield
                  className={`w-5 h-5 ${role === "admin" ? "text-[#FF512F]" : "text-gray-400"}`}
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">Admin</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 font-medium leading-tight">
                    Full access to manage company, settings, and team.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Job Access (Interviewer only) */}
          {role === "interviewer" && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Assigned Jobs
                      <span className="hidden sm:inline"> ({selectedJobIds.length} selected)</span>
                    </label>
                  </div>
                  {jobs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="hidden sm:block text-xs font-bold text-[#FF512F] bg-[#FF512F]/10 hover:bg-[#FF512F]/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {selectedJobIds.length === jobs.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {jobs.length > 0 && (
                  <div className="flex sm:hidden items-center justify-between ml-[22px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      ({selectedJobIds.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs font-bold text-[#FF512F] bg-[#FF512F]/10 hover:bg-[#FF512F]/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {selectedJobIds.length === jobs.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}
              </div>

              {jobs.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                  No active jobs available to assign.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[200px] overflow-y-auto scrollbar-brand pr-1.5 pl-1 p-1.5 rounded-lg border border-[#FF512F]/10 bg-[#FFF5F2]/80">
                  {jobs.map((job) => {
                    const isChecked = selectedJobIds.includes(job.id);
                    return (
                      <div
                        key={job.id}
                        onClick={() => handleToggleJob(job.id)}
                        className={`group flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition-all ${isChecked
                          ? "border-[#FF512F]/40 bg-[#FF512F]/10 hover:bg-[#FF512F]/15"
                          : "border-gray-100 bg-white hover:bg-[#FFF5F2] hover:border-[#FF512F]/30"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${isChecked
                            ? "bg-gradient-to-r from-[#FF512F] to-[#FF7A00] border-transparent text-white shadow-sm scale-105"
                            : "border-gray-300 bg-white"
                            }`}
                        >
                          {isChecked && (
                            <svg
                              className="w-3 h-3 stroke-[3.5]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-800 group-hover:text-[#FF512F] transition-colors truncate">{job.title}</div>
                          <div className="text-[10px] text-gray-400 truncate font-medium">
                            {job.department ? `${job.department} • ` : ""}
                            {job.type} • {job.location}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
