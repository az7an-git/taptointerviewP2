import { useAuth } from "@/context/AuthContext";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { createCreditRealtimeHandlers } from "./realtimeCreditHandlers";
import { playCandidateReadyChime } from "./useCandidateReadyAlerts";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useCompanyRealtime() {
  const { user, setCompanyBalance } = useAuth();
  const navigate = useNavigate();
  const companyId = user?.company?.id as string | undefined;
  const titleIntervalRef = useRef<any>(null);
  const originalTitleRef = useRef<string>(document.title);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);

  // Fetch employer notification settings preference on mount
  useEffect(() => {
    jobsApi.getNotificationSettings()
      .then((res) => {
        if (res.data?.candidate_ready_alerts_enabled !== undefined) {
          setAlertsEnabled(res.data.candidate_ready_alerts_enabled);
        }
      })
      .catch((err) => {
        console.warn("Failed to load employer notification settings in realtime hook:", err);
      });
  }, []);

  const stopTitleFlashing = useCallback(() => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }
  }, []);

  // Listen for window focus to stop flashing tab title when employer returns to tab
  useEffect(() => {
    const handleFocus = () => {
      stopTitleFlashing();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      stopTitleFlashing();
    };
  }, [stopTitleFlashing]);

  const triggerCandidateReadyAlert = useCallback((candidateName?: string, jobId?: string) => {
    if (!alertsEnabled) return;

    // Play Web Audio API chime sound
    playCandidateReadyChime();

    // Trigger toast notification with optional queue navigation link
    const msg = candidateName
      ? `${candidateName} is ready to interview!`
      : "A candidate is ready to interview!";

    const role = user?.role === "interviewer" ? "interviewer" : "admin";
    if (jobId) {
      toast.success(msg, {
        duration: 10000,
        action: {
          label: "View Queue",
          onClick: () => navigate(`/${role}/queue/${jobId}`),
        },
      });
    } else {
      toast.success(msg, { duration: 8000 });
    }

    // Flash browser tab title (Candidate ready <-> original title)
    originalTitleRef.current = document.title.includes("Candidate Ready")
      ? "Tap To Interview"
      : document.title;
    let toggle = false;

    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);

    let count = 0;
    titleIntervalRef.current = setInterval(() => {
      count++;
      if (count > 30 || document.hasFocus()) {
        stopTitleFlashing();
        return;
      }
      document.title = toggle ? "🔔 Candidate Ready!" : "⚡ Interview Ready!";
      toggle = !toggle;
    }, 1000);
  }, [alertsEnabled, user?.role, navigate, stopTitleFlashing]);

  const handleCandidateReadyPayload = useCallback((payload: any) => {
    const candidateObj = payload?.candidate;
    const firstName = candidateObj?.first_name || payload?.first_name;
    const lastName = candidateObj?.last_name || payload?.last_name;
    const name = firstName ? `${firstName} ${lastName || ""}`.trim() : undefined;
    const jobId = payload?.job_id;

    triggerCandidateReadyAlert(name, jobId);
  }, [triggerCandidateReadyAlert]);

  const handlers = useMemo(
    () => ({
      ...createCreditRealtimeHandlers(setCompanyBalance),
      employer_idle_warning: (payload: unknown) => {
        const message = (payload as { message?: string })?.message;
        toast.warning(message || "Are you still there? Candidates may be waiting in your interview queue.", {
          duration: 10000,
        });
      },
      candidate_ready: (payload: any) => handleCandidateReadyPayload(payload),
      candidate_confirmed: (payload: any) => handleCandidateReadyPayload(payload),
      candidate_admitted: (payload: any) => handleCandidateReadyPayload(payload),
    }),
    [setCompanyBalance, handleCandidateReadyPayload]
  );

  useRealtimeChannel(companyId ? `company:${companyId}` : null, handlers);
}

