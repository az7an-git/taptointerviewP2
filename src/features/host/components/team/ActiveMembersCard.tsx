import { useState } from "react";
import { Mail, Shield, ShieldCheck, Trash2 } from "lucide-react";
import ConfirmationModal from "@/common/ui/ConfirmationModal";
import { displayNameFromUser } from "@/common/utils/userDisplayName";
import { cn } from "@/lib/utils";
import { ActiveMembersSkeleton } from "./TeamSkeleton";
import { isCompanyOwner } from "@/common/utils/permissions";

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

interface ActiveMembersCardProps {
  members: Member[];
  isLoadingMembers: boolean;
  membersPage: number;
  membersTotalPages: number;
  onPageChange: (page: number) => void;
  onDeleteMember: (memberId: string) => Promise<void>;
  onViewProfile?: (member: Member) => void;
  currentUserId?: string;
  companyCreatedBy?: string;
}

export function ActiveMembersCard({
  members,
  isLoadingMembers,
  membersPage,
  membersTotalPages,
  onPageChange,
  onDeleteMember,
  onViewProfile,
  currentUserId,
  companyCreatedBy,
}: ActiveMembersCardProps) {
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteMember(memberToDelete);
      setMemberToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 min-w-0 max-w-full">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Active Members</h3>
        <p className="text-xs text-gray-400 mb-4">Click on a member to edit their profile.</p>
        <div className="divide-y divide-[#FF512F]/20">
          {isLoadingMembers ? (
            <ActiveMembersSkeleton />
          ) : members.length === 0 ? (
            <div className="py-4 text-center text-gray-500 text-sm">No members found.</div>
          ) : (
            members.map((member) => {
              const isCurrentUser = member.id === currentUserId;
              const isOwner = isCompanyOwner(member.id, companyCreatedBy);
              const canManageMember = !isCurrentUser && !isOwner;
              const displayName = displayNameFromUser(member) || member.email;
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={member.id}
                  aria-current={isCurrentUser ? "true" : undefined}
                  onClick={() => canManageMember && onViewProfile?.(member)}
                  className={cn(
                    "group py-3.5 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 transition-all duration-200 min-w-0 rounded-xl border border-transparent",
                    isCurrentUser
                      ? "bg-gradient-to-r from-[#FF512F]/10 via-orange-50/60 to-transparent border-[#FF512F]/20 shadow-sm"
                      : canManageMember
                        ? "hover:bg-[#FFF5F2]/60 hover:border-[#FF512F]/20 cursor-pointer"
                        : "hover:bg-[#FFF5F2]/40"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1 sm:min-w-[12rem]">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-600 text-sm group-hover:from-[#FF512F]/20 group-hover:to-[#FF7A00]/20 group-hover:text-[#FF512F] transition-colors">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 group-hover:text-[#FF512F] transition-colors text-xs sm:text-sm min-w-0 break-words">
                        {displayName}
                        {isOwner && (
                          <span className="ml-1.5 text-[10px] font-bold text-[#FF512F] uppercase">Owner</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-medium flex items-start gap-1.5 mt-0.5 min-w-0">
                        <Mail className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex w-full min-w-0 shrink-0 sm:w-auto items-center justify-between sm:justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${member.is_active ? "bg-[#E8F6EF] text-[#10B981]" : "bg-amber-50 text-amber-600"
                          }`}
                      >
                        {member.is_active ? "Active" : "Inactive"}
                      </span>

                      <div
                        className={`flex items-center gap-1 text-xs font-bold shrink-0 ${member.role === "admin" ? "text-[#FF512F]" : "text-indigo-500"
                          }`}
                      >
                        {isOwner ? (
                          <Shield className="w-3.5 h-3.5 shrink-0" style={{ fill: "currentColor" }} />
                        ) : member.role === "admin" ? (
                          <Shield className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </div>

                    {canManageMember && (
                      <button
                        type="button"
                        className="shrink-0 p-1.5 text-gray-400 hover:text-[#FF3B30] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        onClick={() => setMemberToDelete(member.id)}
                        aria-label={`Remove ${displayName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100 min-w-0">
          <button
            onClick={() => onPageChange(Math.max(membersPage - 1, 1))}
            disabled={membersPage === 1 || isLoadingMembers}
            className="shrink-0 px-2 py-1.5 sm:px-3 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-gray-700 text-center min-w-0 truncate px-1">
            Page {membersPage} {membersTotalPages > 1 && `of ${membersTotalPages}`}
          </span>
          <button
            onClick={() => onPageChange(membersPage + 1)}
            disabled={membersPage >= membersTotalPages || isLoadingMembers || members.length < 10}
            className="shrink-0 px-2 py-1.5 sm:px-3 text-xs font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!memberToDelete}
        onClose={() => !isDeleting && setMemberToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Team Member"
        description="Are you sure you want to remove this member from your company? This action cannot be undone."
        confirmText="Remove"
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
}
