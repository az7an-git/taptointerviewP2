import React, { useState } from "react";
import { UserPlus, Mail, User, Shield, ShieldCheck, Briefcase } from "lucide-react";
import { Job } from "@/types/job";
import { Spinner } from "@/common/ui/Spinner";

interface InviteMemberFormProps {
  jobs: Job[];
  isInviting: boolean;
  onSendInvite: (data: { email: string; first_name: string; last_name: string; role: string; job_ids?: string[] }) => Promise<void>;
}

export function InviteMemberForm({
  jobs,
  isInviting,
  onSendInvite,
}: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("interviewer");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) return;

    await onSendInvite({
      email: email.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
      ...(role === "interviewer"
        ? { job_ids: selectedJobIds }
        : {}),
    });

    // Reset form on success
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("interviewer");
    setSelectedJobIds([]);
  };

  const handleToggleJob = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectAllJobs = () => {
    if (selectedJobIds.length === jobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map((j) => j.id));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300 min-w-0 max-w-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <UserPlus className="w-5 h-5 text-[#FF512F]" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Invite Team Member</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Email Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                autoComplete="given-name"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] transition-colors bg-white text-gray-900"
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                autoComplete="family-name"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] transition-colors bg-white text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <div className="relative min-w-0 flex flex-col">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 shrink-0">
              Email Address
            </label>
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="interviewer@example.com"
                className="w-full h-full min-h-[42px] pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF512F] transition-colors bg-white text-gray-900 text-ellipsis overflow-hidden"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="min-w-0 flex flex-col">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 shrink-0">
              Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <button
                type="button"
                onClick={() => setRole("interviewer")}
                className={`cursor-pointer flex items-center gap-2 p-2 border rounded-lg text-left transition-all min-w-0 h-full ${role === "interviewer"
                  ? "border-[#FF512F] bg-gradient-to-r from-[#FF512F]/5 to-[#FF7A00]/5 text-[#FF512F] shadow-sm"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600 bg-white"
                  }`}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${role === "interviewer" ? "text-[#FF512F]" : "text-gray-400"}`} />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider truncate">Interviewer</div>
                  <div className="text-[10px] text-gray-700 leading-tight truncate">Can view assigned jobs.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`cursor-pointer flex items-center gap-2 p-2 border rounded-lg text-left transition-all min-w-0 h-full ${role === "admin"
                  ? "border-[#FF512F] bg-gradient-to-r from-[#FF512F]/5 to-[#FF7A00]/5 text-[#FF512F] shadow-sm"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600 bg-white"
                  }`}
              >
                <Shield className={`w-4 h-4 shrink-0 ${role === "admin" ? "text-[#FF512F]" : "text-gray-400"}`} />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider truncate">Admin</div>
                  <div className="text-[10px] text-gray-700 leading-tight truncate">Full company access.</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Job Access Permissions (Only for Interviewer) */}
        <div className={`grid transition-all duration-300 ease-in-out ${role === "interviewer" ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
          <div className="overflow-hidden">
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Assigned Jobs Access<span className="hidden sm:inline"> ({selectedJobIds.length} selected)</span>
                    </label>
                  </div>
                  {jobs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllJobs}
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
                      onClick={handleSelectAllJobs}
                      className="text-xs font-bold text-[#FF512F] bg-[#FF512F]/10 hover:bg-[#FF512F]/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {selectedJobIds.length === jobs.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                )}
              </div>

              {jobs.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                  No active or draft jobs found. You can still send the invite, but they won't have access to any jobs initially.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[180px] overflow-y-auto scrollbar-brand pr-1.5 pl-1 p-1.5 rounded-lg border border-[#FF512F]/10 bg-[#FFF5F2]/80">
                  {jobs.map((job) => {
                    const isChecked = selectedJobIds.includes(job.id);
                    return (
                      <div
                        key={job.id}
                        onClick={() => handleToggleJob(job.id)}
                        className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${isChecked
                          ? "border-[#FF512F]/40 bg-[#FF512F]/5"
                          : "border-gray-100 bg-white"
                          }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-200 ${isChecked
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
                          <div className="text-xs font-bold text-gray-800 truncate">{job.title}</div>
                          <div className="text-[10px] text-gray-400 truncate font-medium">
                            {job.department ? `${job.department} • ` : ""}{job.type} • {job.location}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            className={`w-full sm:w-auto bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-bold px-8 py-2.5 rounded-lg text-sm transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg whitespace-nowrap ${isInviting ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
              }`}
            disabled={isInviting}
          >
            {isInviting ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
                <span>Sending Invitation...</span>
              </div>
            ) : (
              "Send Invitation"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
