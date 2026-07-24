import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Users, ShieldCheck, Zap, Loader2, PauseCircle, CheckCircle, Video, BellRing } from "lucide-react";
import publicApi from "@/api/publicApi";
import { ParticipantHeader, ParticipantFooter } from "../components";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

interface QueueStatusData {
  status: string;
  queue_pause_status: string;
  remaining_seconds: number | null;
  total_participants: number;
  participants_before_me: number;
  my_number: number;
  estimated_wait_minutes: number;
}

const POLL_INTERVAL_MS = 60_000;
const ACTIVE_POLL_INTERVAL_MS = 70_000;

function isAdmittedStatus(status: string | undefined): boolean {
  return status?.toLowerCase() === "called";
}

function isConfirmedStatus(status: string | undefined): boolean {
  const normalized = status?.toLowerCase();
  return normalized === "confirmed" || normalized === "admitted";
}

function isInSessionStatus(status: string | undefined): boolean {
  return status?.toLowerCase() === "in_session";
}

function isInterviewWrappingUpStatus(status: string | undefined): boolean {
  return status?.toLowerCase() === "pending_outcome";
}

function isInterviewFinishedStatus(status: string | undefined): boolean {
  const normalized = status?.toLowerCase();
  return normalized === "resolved" || normalized === "pending_review" || normalized === "pending review";
}

export default function QueueStatusPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState<QueueStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queueEntryId = useMemo(() => localStorage.getItem("queue_entry_id"), []);
  const jobId = useMemo(() => localStorage.getItem("selectedJobId"), []);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Sequence Enforcement: Ensure they went through the required flow and have a token
  useEffect(() => {
    const participantToken = localStorage.getItem("participant_token");
    if (!participantToken) {
      navigate(`/company/${slug}`);
    }
  }, [navigate, slug]);

  const companyName =
    localStorage.getItem("selectedCompanyName") ||
    (slug && slug !== ":"
      ? slug.charAt(0).toUpperCase() + slug.slice(1)
      : "Platform");

  const jobTitle =
    localStorage.getItem("selectedJobTitle") || "Candidate Interview Room";

  const fetchStatus = useCallback(async () => {
    const participantToken = localStorage.getItem("participant_token");
    if (!participantToken) {
      navigate(`/company/${slug}`);
      return;
    }

    try {
      const response = await publicApi.get<{
        status: string;
        data: QueueStatusData;
      }>("/participant/queue/status", {
        headers: { Authorization: `Bearer ${participantToken}` },
      });

      if (response.data.status === "success") {
        setQueueData(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch queue status", err);
      setError("Unable to fetch queue status. Retrying...");
    } finally {
      setLoading(false);
    }
  }, [navigate, slug]);

  // Sync and tick down secondsLeft when status is called
  useEffect(() => {
    if (queueData?.status?.toLowerCase() === "called" && queueData.remaining_seconds !== null) {
      setSecondsLeft(queueData.remaining_seconds);
    } else {
      setSecondsLeft(null);
    }
  }, [queueData?.status, queueData?.remaining_seconds]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft !== null]);

  useEffect(() => {
    if (!queueData) return;
    const status = queueData.status?.toLowerCase();
    if (status === "declined" || status === "removed") {
      navigate(`/company/${slug}`);
    }
  }, [queueData?.status, navigate, slug]);

  useRealtimeChannel(queueEntryId ? `queue_entry:${queueEntryId}` : null, {
    participant_called: (payload) => {
      const remainingSeconds = (payload as { remaining_seconds?: number })
        ?.remaining_seconds;
      setQueueData((current) =>
        current
          ? {
            ...current,
            status: "called",
            remaining_seconds:
              remainingSeconds ?? current.remaining_seconds,
          }
          : current
      );
    },
    participant_admitted: () => {
      void fetchStatus();
    },
    participant_missed: () => {
      void fetchStatus();
    },
    session_started: () => {
      void fetchStatus();
    },
    session_ended: () => {
      void fetchStatus();
    },
    outcome_saved: () => {
      void fetchStatus();
    },
  });

  // Job-level events (pause/resume, window changes) are not sent on queue_entry channels.
  useRealtimeChannel(jobId ? `job:${jobId}` : null, {
    queue_status_changed: () => {
      void fetchStatus();
    },
    queue_windows_updated: () => {
      void fetchStatus();
    },
  });

  useEffect(() => {
    document.title = `Queue Status | ${companyName}`;
    return () => {
      document.title = "Tap To Interview";
    };
  }, [companyName]);

  // Background poll as a safety net; primary updates come from Supabase realtime below.
  useEffect(() => {
    fetchStatus();
    const status = queueData?.status?.toLowerCase();
    const fastPoll =
      status === "called" ||
      status === "admitted" ||
      status === "confirmed" ||
      status === "in_session" ||
      status === "pending_outcome";
    const intervalMs = fastPoll ? ACTIVE_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
    const interval = setInterval(fetchStatus, intervalMs);
    return () => clearInterval(interval);
  }, [fetchStatus, queueData?.status]);

  // Refetch when this tab regains focus (e.g. after interview ends in another tab)
  useEffect(() => {
    const refresh = () => {
      void fetchStatus();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchStatus]);

  const statusHint = (() => {
    const status = queueData?.status?.toLowerCase();
    if (status === "called") {
      return "Check your email and open the admission link in a new tab to confirm your spot.";
    }
    if (status === "confirmed" || status === "admitted") {
      return "Admission confirmed. Continue in the tab where you opened your email link.";
    }
    if (status === "in_session") {
      return "Your interview is active in the tab where you confirmed admission. You can close this tab.";
    }
    if (isInterviewWrappingUpStatus(status)) {
      return "Your interview has ended. You can close this window whenever you're ready.";
    }
    if (isInterviewFinishedStatus(status)) {
      return "Your interview is complete. You can close this window if you want.";
    }
    return "You are currently in line. Please do not close this window.";
  })();
  const position = queueData?.my_number ?? null;
  const waitTime = queueData?.estimated_wait_minutes ?? null;
  const peopleAhead = queueData?.participants_before_me ?? null;

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#E04020] opacity-5 blur-3xl rounded-full pointer-events-none"></div>

      <ParticipantHeader companyName={companyName} />

      {/* Main Content */}
      <div className="flex-1 px-4 py-5 sm:p-6 relative z-10 w-full max-w-full flex flex-col items-center justify-start">
        <div className="text-center space-y-4 sm:space-y-5 max-w-4xl w-full min-w-0 my-auto">

          {/* Status Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[#FF512F] text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Waiting Room Session</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight break-words px-1">
              {jobTitle}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {statusHint}
            </p>
          </div>

          {/* In session — interview is active */}
          {!loading && isInSessionStatus(queueData?.status) && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#FF512F]/20 border border-[#FF512F]/30 flex items-center justify-center">
                  <Video className="w-12 h-12 text-[#FF512F]" />
                </div>
                <div className="absolute inset-0 rounded-full bg-[#FF512F]/10 animate-ping" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF512F]">
                  Interview In Progress
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Session Active
                </h2>
                <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto">
                  Your interview is underway in the tab where you confirmed your admission link.
                </p>
                <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto pt-1">
                  You can close this window if you want, your interview is happening in the other tab.
                </p>
              </div>
            </div>
          )}

          {/* Interview ended — host saving outcome */}
          {!loading && isInterviewWrappingUpStatus(queueData?.status) && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-24 h-24 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-amber-400" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Interview Ended
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Wrapping Up
                </h2>
                <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto">
                  The host has ended your session and is finalizing the outcome.
                </p>
                <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto pt-1">
                  You can close this window if you want.
                </p>
              </div>
            </div>
          )}

          {/* Interview complete */}
          {!loading && isInterviewFinishedStatus(queueData?.status) && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  All Done
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  You&apos;re All Set!
                </h2>
                <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto">
                  The outcome for your interview has been recorded. Thank you for your time.
                </p>
                <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto pt-1">
                  You can close this window if you want.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/company/${slug}`)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-6 rounded-lg transition-colors cursor-pointer text-sm"
              >
                Return to Jobs Page
              </button>
            </div>
          )}

          {/* Admitted — waiting for user to confirm in email */}
          {!loading && isAdmittedStatus(queueData?.status) && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <BellRing className="w-12 h-12 text-amber-400" />
                </div>
                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Action Required</p>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Your Turn Has Arrived!</h2>
                <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                  We've sent a secure admission link to your email. Please click the link to confirm your spot.
                </p>
              </div>
              <div className="text-2xl font-black text-[#FF512F] tabular-nums">
                Expires in: {secondsLeft !== null ? `${secondsLeft}s` : "..."}
              </div>
            </div>
          )}

          {/* Confirmed — waiting for host to start */}
          {!loading && isConfirmedStatus(queueData?.status) && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Admission Confirmed</p>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">You're In!</h2>
                <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto">
                  Your spot has been secured. Return to the tab where you opened your email link, the host will start your session there.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                <Video className="w-3.5 h-3.5" />
                <span>Waiting for host to start the interview...</span>
              </div>
            </div>
          )}

          {/* Loading (waiting in queue) */}
          {loading && !isAdmittedStatus(queueData?.status) && !isConfirmedStatus(queueData?.status) && !isInSessionStatus(queueData?.status) && !isInterviewWrappingUpStatus(queueData?.status) && !isInterviewFinishedStatus(queueData?.status) && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-[#FF512F] animate-spin" />
              <p className="text-xs text-gray-500 font-medium">
                Fetching your queue position...
              </p>
            </div>
          )}

          {!loading &&
            !isAdmittedStatus(queueData?.status) &&
            !isConfirmedStatus(queueData?.status) &&
            !isInSessionStatus(queueData?.status) &&
            !isInterviewWrappingUpStatus(queueData?.status) &&
            !isInterviewFinishedStatus(queueData?.status) && (
              <>
                {/* Error state (non-blocking banner when we already have data) */}
                {error && !queueData && (
                  <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Paused State Alert */}
                {!loading && queueData?.queue_pause_status === "paused" && (
                  <div className="max-w-xl mx-auto bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3 text-left">
                    <PauseCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-500">
                        Queue Paused
                      </p>
                      <p className="text-xs font-medium text-amber-500/80 mt-1">
                        The host has temporarily paused the queue. Your position is saved. Please wait for the host to resume.
                      </p>
                    </div>
                  </div>
                )}

                {/* Wrapping Up State Alert */}
                {!loading && (queueData?.queue_pause_status === "wrapping_up" || queueData?.status === "wrapping_up") && (
                  <div className="max-w-xl mx-auto bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3 text-left">
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-500">
                        Interview Window Wrapping Up
                      </p>
                      <p className="text-xs font-medium text-amber-500/80 mt-1">
                        This interview window is wrapping up. Candidates currently in line remain protected and will continue to be called.
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                {!loading && queueData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mx-auto py-2">
                      {/* Position */}
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center space-y-1">
                        <span className="text-5xl font-black text-[#FF512F]">
                          {position ?? "-"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          Your Position
                        </span>
                      </div>

                      {/* Wait Time */}
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center space-y-1">
                        <Clock className="w-6 h-6 text-amber-400 mb-1" />
                        <span className="text-2xl font-bold text-white">
                          {waitTime !== null ? `${waitTime} mins` : "-"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          Est. Wait Time
                        </span>
                      </div>

                      {/* People Ahead */}
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col items-center justify-center space-y-1">
                        <Users className="w-6 h-6 text-blue-400 mb-1" />
                        <span className="text-2xl font-bold text-white">
                          {peopleAhead !== null ? peopleAhead : "-"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          People Ahead
                        </span>
                      </div>
                    </div>

                    {/* Soft error banner (polling failure while data is shown) */}
                    {error && (
                      <p className="text-[11px] text-amber-500/70 font-medium">
                        {error}
                      </p>
                    )}
                  </>
                )}

                {/* Alert Box */}
                <div className="max-w-xl mx-auto bg-[#FF3B30]/5 backdrop-blur-sm text-[#FF3B30] p-3.5 rounded-lg flex items-start gap-2.5 text-left border border-[#FF3B30]/10">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide">
                      Important Notice
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                      When it's your turn, you will receive an email with your secure admission link. You
                      will have 90 seconds to click the link and confirm your spot.
                    </p>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      <ParticipantFooter />
    </div>
  );
}
