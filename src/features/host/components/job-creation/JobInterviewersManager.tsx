import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { UserPlus, UserMinus, ShieldCheck } from "lucide-react";
import { displayNameFromUser, initialsFromDisplayName } from "@/common/utils/userDisplayName";
import { StepLoadingState } from "@/common/ui/StepLoadingState";
import { cn } from "@/lib/utils";

interface JobInterviewersManagerProps {
  jobId: string;
}

interface Member {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  is_active: boolean;
  role: string;
  job_ids?: string[];
}

export default function JobInterviewersManager({ jobId }: JobInterviewersManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [jobId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Fetch up to 100 members to easily assign them
      const response = await authService.getCompanyMembers(1, 100);
      if (response.status === "success" && response.data?.members) {
        setMembers(response.data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      toast.error("Failed to load interviewers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (member: Member) => {
    setIsUpdating(member.id);
    try {
      const currentJobIds = member.job_ids || [];
      if (!currentJobIds.includes(jobId)) {
        const updatedJobIds = [...currentJobIds, jobId];
        await authService.updateMember(member.id, { job_ids: updatedJobIds });
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, job_ids: updatedJobIds } : m))
        );
        toast.success(`Assigned ${displayNameFromUser(member)} to job.`);
      }
    } catch (error) {
      console.error("Failed to assign interviewer:", error);
      toast.error("Failed to assign interviewer.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUnassign = async (member: Member) => {
    setIsUpdating(member.id);
    try {
      const currentJobIds = member.job_ids || [];
      const updatedJobIds = currentJobIds.filter((id) => id !== jobId);
      await authService.updateMember(member.id, { job_ids: updatedJobIds });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, job_ids: updatedJobIds } : m))
      );
      toast.success(`Removed ${displayNameFromUser(member)} from job.`);
    } catch (error) {
      console.error("Failed to unassign interviewer:", error);
      toast.error("Failed to unassign interviewer.");
    } finally {
      setIsUpdating(null);
    }
  };

  const interviewers = members.filter((m) => m.role === "interviewer");
  const assigned = interviewers.filter((m) => m.job_ids?.includes(jobId));
  const available = interviewers.filter((m) => !m.job_ids?.includes(jobId));

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-w-0">
        <div className="h-40 flex items-center justify-center">
          <StepLoadingState message="Loading interviewers..." />
        </div>
      </div>
    );
  }

  const renderMember = (member: Member, isAssigned: boolean) => {
    const displayName = displayNameFromUser(member) || member.email;
    const initial = initialsFromDisplayName(displayName);
    const isLoadingMember = isUpdating === member.id;

    return (
      <div
        key={member.id}
        className="py-3 px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 text-xs">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 text-xs truncate">
              {displayName}
            </div>
            <div className="text-[10px] text-gray-500 truncate">
              {member.email}
            </div>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={() => isAssigned ? handleUnassign(member) : handleAssign(member)}
            disabled={isLoadingMember}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
              isAssigned
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
            )}
          >
            {isLoadingMember ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            ) : isAssigned ? (
              <UserMinus className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
            )}
            {isAssigned ? "Remove" : "Assign"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-w-0 space-y-6 animate-fade-in-up">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          Manage Interviewers
        </h3>
        <p className="text-sm text-gray-500">
          Assign team members to conduct interviews for this job.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Assigned ({assigned.length})
          </h4>
          <div className="space-y-2">
            {assigned.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500">No interviewers assigned yet.</p>
              </div>
            ) : (
              assigned.map(m => renderMember(m, true))
            )}
          </div>
        </div>

        {/* Available */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            Available ({available.length})
          </h4>
          <div className="space-y-2">
            {available.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500">No available interviewers to assign.</p>
              </div>
            ) : (
              available.map(m => renderMember(m, false))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
