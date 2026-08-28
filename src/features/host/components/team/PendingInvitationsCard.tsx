import { Mail, Shield, ShieldCheck, Trash2 } from "lucide-react";
import { PendingInvitationsSkeleton } from "./TeamSkeleton";

interface PendingInvite {
  id: string;
  invited_email: string;
  first_name?: string;
  last_name?: string;
  status: string;
  role?: string;
  invited_role?: string;
}

function pendingInviteDisplayName(invite: PendingInvite): string {
  const parts = [invite.first_name?.trim(), invite.last_name?.trim()].filter(Boolean);
  const joined = parts.join(" ").trim();
  return joined || invite.invited_email;
}

function getInviteRole(invite: PendingInvite): string {
  return invite.invited_role ?? invite.role ?? "interviewer";
}

interface PendingInvitationsCardProps {
  pendingInvites: PendingInvite[];
  isLoadingPending: boolean;
  pendingPage: number;
  pendingTotalPages: number;
  onPageChange: (page: number) => void;
  onDeleteInvite: (id: string) => void;
}

export function PendingInvitationsCard({
  pendingInvites,
  isLoadingPending,
  pendingPage,
  pendingTotalPages,
  onPageChange,
  onDeleteInvite,
}: PendingInvitationsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 min-w-0 max-w-full">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
        Pending Invitations
      </h3>
      <div className="divide-y divide-[#FF512F]/30">
        {isLoadingPending ? (
          <PendingInvitationsSkeleton />
        ) : pendingInvites.length === 0 ? (
          <div className="py-4 text-center text-gray-500 text-sm">No pending invites.</div>
        ) : (
          pendingInvites.map((invite) => {
            const inviteRole = getInviteRole(invite);
            const isAdmin = inviteRole === "admin";

            const displayName = pendingInviteDisplayName(invite);
            const initial = (displayName || invite.invited_email).charAt(0).toUpperCase();

            return (
              <div
                key={invite.id}
                className="group py-3.5 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 hover:bg-[#FFF5F2]/60 hover:border-[#FF512F]/20 border border-transparent transition-all duration-200 cursor-pointer min-w-0 rounded-xl"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1 sm:min-w-[12rem]">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-600 text-sm group-hover:from-[#FF512F]/20 group-hover:to-[#FF7A00]/20 group-hover:text-[#FF512F] transition-colors">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 group-hover:text-[#FF512F] transition-colors text-xs sm:text-sm min-w-0 break-words">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex items-start gap-1.5 mt-0.5 min-w-0">
                      <Mail className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words [overflow-wrap:anywhere]">{invite.invited_email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full min-w-0 shrink-0 sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 capitalize">
                      {invite.status}
                    </span>

                    <div
                      className={`flex items-center gap-1 text-xs font-bold ${isAdmin ? "text-[#FF512F]" : "text-indigo-500"
                        }`}
                    >
                      {isAdmin ? (
                        <Shield className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{inviteRole}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 p-1.5 text-gray-400 hover:text-[#FF3B30] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={() => onDeleteInvite(invite.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100 min-w-0">
        <button
          onClick={() => onPageChange(Math.max(pendingPage - 1, 1))}
          disabled={pendingPage === 1 || isLoadingPending}
          className="shrink-0 px-2 py-1.5 sm:px-3 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Previous
        </button>
        <span className="text-xs font-bold text-gray-700 text-center min-w-0 truncate px-1">
          Page {pendingPage} {pendingTotalPages > 1 && `of ${pendingTotalPages}`}
        </span>
        <button
          onClick={() => onPageChange(pendingPage + 1)}
          disabled={pendingPage >= pendingTotalPages || isLoadingPending || pendingInvites.length < 10}
          className="shrink-0 px-2 py-1.5 sm:px-3 text-xs font-bold text-white bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}