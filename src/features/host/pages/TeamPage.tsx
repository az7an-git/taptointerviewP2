import { useState, useEffect, useMemo } from "react";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { canManageTeam, normalizeRole, ROLES } from "@/common/utils/permissions";
import ConfirmationModal from "@/common/ui/ConfirmationModal";
import PageHeader from "@/common/ui/PageHeader";
import { ActiveMembersCard, PendingInvitationsCard, InviteMemberForm, MemberProfileModal } from "../components";
import { jobsApi } from "@/api/jobsApi";
import { Job } from "@/types/job";

// Module-level cache
let cachedMembers: any[] | null = null;
let cachedMembersPage = 1;
let cachedMembersTotalPages = 1;

let cachedPendingInvites: any[] | null = null;
let cachedPendingPage = 1;
let cachedPendingTotalPages = 1;

export default function TeamPage() {
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const membersPage = useMemo(() => parseInt(searchParams.get("membersPage") || "1", 10), [searchParams]);
  const pendingPage = useMemo(() => parseInt(searchParams.get("pendingPage") || "1", 10), [searchParams]);

  const updatePageInUrl = (key: string, page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, page.toString());
    setSearchParams(params, { replace: true });
  };

  const [members, setMembers] = useState<any[]>(
    membersPage === cachedMembersPage ? cachedMembers || [] : []
  );
  const [isLoadingMembers, setIsLoadingMembers] = useState(
    !(membersPage === cachedMembersPage && cachedMembers)
  );
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>(
    pendingPage === cachedPendingPage ? cachedPendingInvites || [] : []
  );
  const [isLoadingPending, setIsLoadingPending] = useState(
    !(pendingPage === cachedPendingPage && cachedPendingInvites)
  );
  const [inviteToDelete, setInviteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Member profile modal
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [membersTotalPages, setMembersTotalPages] = useState(
    cachedMembersPage === membersPage ? cachedMembersTotalPages : 1
  );
  const [pendingTotalPages, setPendingTotalPages] = useState(
    cachedPendingPage === pendingPage ? cachedPendingTotalPages : 1
  );

  const fetchPendingInvites = async (page = 1, silent = false) => {
    if (!silent) setIsLoadingPending(true);
    try {
      const response = await authService.getPendingInvites(page);
      if (response.status === "success" && response.data?.invites) {
        if (response.data.invites.length === 0 && page > 1) {
          updatePageInUrl("pendingPage", page - 1);
          return;
        }
        setPendingInvites(response.data.invites);
        cachedPendingInvites = response.data.invites;
        cachedPendingPage = page;
        if (response.data.pagination?.total_pages) {
          setPendingTotalPages(response.data.pagination.total_pages);
          cachedPendingTotalPages = response.data.pagination.total_pages;
        }
      }
    } catch (error) {
      console.error("Failed to fetch pending invites", error);
    } finally {
      if (!silent) setIsLoadingPending(false);
    }
  };

  const fetchCompanyMembers = async (page = 1, silent = false) => {
    if (!silent) setIsLoadingMembers(true);
    try {
      const response = await authService.getCompanyMembers(page);
      if (response.status === "success" && response.data?.members) {
        if (response.data.members.length === 0 && page > 1) {
          updatePageInUrl("membersPage", page - 1);
          return;
        }
        setMembers(response.data.members);
        cachedMembers = response.data.members;
        cachedMembersPage = page;
        if (response.data.pagination?.total_pages) {
          setMembersTotalPages(response.data.pagination.total_pages);
          cachedMembersTotalPages = response.data.pagination.total_pages;
        }
      }
    } catch (error) {
      console.error("Failed to fetch company members", error);
    } finally {
      if (!silent) setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    const isCached = pendingPage === cachedPendingPage && cachedPendingInvites;
    fetchPendingInvites(pendingPage, !!isCached);
  }, [pendingPage]);

  useEffect(() => {
    const isCached = membersPage === cachedMembersPage && cachedMembers;
    fetchCompanyMembers(membersPage, !!isCached);
  }, [membersPage]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobsApi.getJobs({ page: 1, limit: 100, status: "active" });
        setJobs(response.data);
      } catch (error) {
        console.error("Failed to fetch jobs for invite form", error);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (inviteToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [inviteToDelete]);

  const handleSendInvite = async (data: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    job_ids?: string[];
  }) => {
    setIsInviting(true);
    try {
      const assignableIds = new Set(jobs.map((j) => j.id));
      const payload = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        ...(data.role === "interviewer" && data.job_ids?.length
          ? { job_ids: data.job_ids.filter((id) => assignableIds.has(id)) }
          : {}),
      };
      await authService.sendInvite(payload);
      toast.success("Invite sent successfully!");
      fetchPendingInvites(1, true);
    } catch (error: any) {
      console.error("Failed to send invite", error);
      toast.error(error.response?.data?.data || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await authService.deleteMember(memberId);
      toast.success("Member removed successfully");
      fetchCompanyMembers(membersPage, true);
    } catch (error: any) {
      console.error("Failed to delete member", error);
      toast.error(error.response?.data?.data || "Failed to remove member");
    }
  };


  const handleViewProfile = (member: any) => {
    setSelectedMember(member);
  };

  const handleSaveMember = async (
    memberId: string,
    data: { role?: string; job_ids?: string[] }
  ) => {
    setIsSavingMember(true);
    try {
      await authService.updateMember(memberId, data);
      toast.success("Member updated successfully");
      setSelectedMember(null);
      fetchCompanyMembers(membersPage, true);
    } catch (error: any) {
      console.error("Failed to update member", error);
      toast.error(error.response?.data?.data || "Failed to update member");
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteInvite = (id: string) => {
    setInviteToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!inviteToDelete) return;
    setIsDeleting(true);
    try {
      await authService.deleteInvite(inviteToDelete);
      toast.success("Invite deleted successfully");
      setInviteToDelete(null);
      fetchPendingInvites(pendingPage, true);
    } catch (error: any) {
      console.error("Failed to delete invite", error);
      toast.error(error.response?.data?.data || "Failed to delete invite");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canManageTeam(user?.role)) {
    const basePath =
      normalizeRole(user?.role) === ROLES.INTERVIEWER ? "/interviewer" : "/admin";
    return <Navigate to={`${basePath}/dashboard`} replace />;
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full animate-page-fade-in">
      {/* Header */}
      <PageHeader
        tag="Manage Team"
        title={<span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">Team Members</span>}
      />

      {/* Invite Form */}
      <InviteMemberForm
        jobs={jobs}
        isInviting={isInviting}
        onSendInvite={handleSendInvite}
      />

      {/* Active Members Card */}
      <ActiveMembersCard
        members={members}
        isLoadingMembers={isLoadingMembers}
        membersPage={membersPage}
        membersTotalPages={membersTotalPages}
        onPageChange={(page) => updatePageInUrl("membersPage", page)}
        onDeleteMember={handleDeleteMember}
        onViewProfile={handleViewProfile}
        currentUserId={user?.id}
        companyCreatedBy={user?.company?.created_by}
      />

      {/* Pending Members Card */}
      <PendingInvitationsCard
        pendingInvites={pendingInvites}
        isLoadingPending={isLoadingPending}
        pendingPage={pendingPage}
        pendingTotalPages={pendingTotalPages}
        onPageChange={(page) => updatePageInUrl("pendingPage", page)}
        onDeleteInvite={handleDeleteInvite}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!inviteToDelete}
        onClose={() => setInviteToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Invitation"
        description="Are you sure you want to delete this pending invitation? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember}
        jobs={jobs}
        isOpen={!!selectedMember}
        isSaving={isSavingMember}
        onClose={() => setSelectedMember(null)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
