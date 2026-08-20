import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "@/common/components/Sidebar";
import CreditsModal from "@/common/components/CreditsModal";
import ConfirmationModal from "@/common/ui/ConfirmationModal";
import { useAuth } from "@/context/AuthContext";
import { displayNameFromUser } from "@/common/utils/userDisplayName";
import { normalizeRole, ROLES } from "@/common/utils/permissions";
import { useCompanyRealtime } from "@/hooks/useCompanyRealtime";
import AppHeader from "@/common/components/AppHeader";
import { useGlobalWindowWarning } from "@/hooks/useGlobalWindowWarning";
import { WindowClosingWarningBanner } from "@/features/host/components/queue/WindowClosingWarningBanner";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";
import { RecruiterRequestModal } from "@/features/host/components/queue/RecruiterRequestModal";

export default function AppLayout() {
  const { logout, user } = useAuth();
  useCompanyRealtime();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { warning, refresh: refreshWarning } = useGlobalWindowWarning();
  const isAdmin = user?.role !== "interviewer";
  const [isWindowActionLoading, setIsWindowActionLoading] = useState(false);
  const [recruiterRequestModalOpen, setRecruiterRequestModalOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleSubmitRecruiterRequest = async (payload: {
    window_id: string;
    request_type: any;
    extend_minutes?: number;
    note?: string;
  }) => {
    if (!warning?.job?.id) return;
    setIsSubmittingRequest(true);
    try {
      await jobsApi.createWindowRequest(warning.job.id, payload);
      toast.success("Window request submitted to admin!");
      setRecruiterRequestModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.data || "Failed to submit request.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleGlobalExtend = async (minutes: number) => {
    if (!warning || !warning.job.id || !warning.window.id) return;
    setIsWindowActionLoading(true);
    try {
      await jobsApi.extendWindow(warning.job.id, warning.window.id, minutes);
      toast.success(`Window extended by ${minutes} minutes.`);
      refreshWarning();
    } catch (err: any) {
      toast.error(err?.response?.data?.data || "Failed to extend window.");
    } finally {
      setIsWindowActionLoading(false);
    }
  };

  const handleGlobalCloseEarly = async () => {
    if (!warning || !warning.job.id || !warning.window.id) return;
    navigate(`/${isAdmin ? "admin" : "interviewer"}/queue/${warning.job.id}`, {
      state: { triggerCloseEarly: warning.window.id }
    });
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ path: string; state?: any } | null>(null);

  // Listen to custom navigation events to prompt before leaving
  useEffect(() => {
    const handleNavigationRequest = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetPath = customEvent.detail.path;
      const targetState = customEvent.detail.state;

      // Only prompt if there is an active session and the path is actually changing
      if ((window as any).__activeInterview && location.pathname !== targetPath) {
        setPendingNavigation({ path: targetPath, state: targetState });
      } else {
        navigate(targetPath, { state: targetState });
      }
    };

    window.addEventListener("trigger-navigation", handleNavigationRequest);
    return () => {
      window.removeEventListener("trigger-navigation", handleNavigationRequest);
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const role = normalizeRole(user?.role);
    if (role === ROLES.INTERVIEWER && location.pathname.startsWith("/admin")) {
      navigate(
        location.pathname.replace(/^\/admin/, "/interviewer") + location.search,
        { replace: true }
      );
    }
  }, [user?.role, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    if ((window as any).__activeInterview) {
      setIsLogoutConfirmOpen(true);
    } else {
      executeLogout();
    }
  };

  const executeLogout = async () => {
    (window as any).__activeInterview = false;
    setIsLoggingOut(true);
    await logout();
  };

  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenCreditsModal = () => setIsCreditsModalOpen(true);
    window.addEventListener("open-credits-modal", handleOpenCreditsModal);
    return () => window.removeEventListener("open-credits-modal", handleOpenCreditsModal);
  }, []);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#FFF5F2] flex flex-col lg:flex-row font-sans text-gray-900">
      <Sidebar
        fullName={displayNameFromUser(user)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        role={user?.role}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreditsClick={() => setIsCreditsModalOpen(true)}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
        />

        {warning && !location.pathname.includes('/queue') && (
          <WindowClosingWarningBanner
            layout="bar"
            jobTitle={warning.job.title}
            minutesRemaining={warning.minutesRemaining}
            waitingCount={warning.waitingCount}
            isAdmin={isAdmin}
            isActionLoading={isWindowActionLoading}
            onExtend={handleGlobalExtend}
            onCloseEarly={handleGlobalCloseEarly}
            onRequestExtension={() => setRecruiterRequestModalOpen(true)}
            onRequestEarlyClose={() => setRecruiterRequestModalOpen(true)}
          />
        )}

        <div className="flex-1 min-w-0 max-w-full p-4 overflow-y-auto overflow-x-hidden scrollbar-hide">

          <style>{`
            @keyframes pageFadeIn {
              from { opacity: 0.4; }
              to { opacity: 1; }
            }
            .animate-page-fade-in {
              animation: pageFadeIn 0.1s ease-out forwards;
            }
          `}</style>
          <div className="animate-page-fade-in h-full">
            <Outlet context={{
              credits: user?.company?.balance ?? 0,
              openCreditsModal: () => setIsCreditsModalOpen(true)
            }} />
          </div>
        </div>
      </div>

      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        currentCredits={user?.company?.balance ?? 0}
      />

      <RecruiterRequestModal
        isOpen={recruiterRequestModalOpen}
        windowId={warning?.window?.id || ""}
        isSubmitting={isSubmittingRequest}
        onClose={() => setRecruiterRequestModalOpen(false)}
        onSubmitRequest={handleSubmitRecruiterRequest}
      />

      <ConfirmationModal
        isOpen={!!pendingNavigation}
        title="Active Interview in Progress"
        description="You have an active interview session in progress. Navigating away will disconnect the call. Are you sure you want to leave?"
        confirmText="Leave Session"
        cancelText="Stay"
        onConfirm={() => {
          (window as any).__activeInterview = false;
          if (pendingNavigation) {
            navigate(pendingNavigation.path, { state: pendingNavigation.state });
          }
          setPendingNavigation(null);
        }}
        onClose={() => {
          setPendingNavigation(null);
        }}
      />

      <ConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="Active Interview in Progress"
        description="You have an active interview session in progress. Logging out will disconnect the call. Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Stay"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          executeLogout();
        }}
        onClose={() => {
          setIsLogoutConfirmOpen(false);
        }}
      />
    </div>
  );
}
