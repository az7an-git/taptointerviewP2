import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { participantApi } from "@/api/participantApi";
import {
  Video,
  Mic,
  Settings,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  PhoneOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { ParticipantHeader, ParticipantFooter } from "../components";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { useDailySession } from "@/hooks/useDailySession";
import { Spinner } from "@/common/ui/Spinner";

// ─── types ────────────────────────────────────────────────────────────────────
type LocalSetupState = {
  cameraOn: boolean;
  micOn: boolean;
  selectedCamera: string;
  selectedMic: string;
  isCameraOpen: boolean;
  isMicOpen: boolean;
};

// ─── small reusable sub-components ───────────────────────────────────────────

function DeviceDropdown({
  label,
  icon,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="relative">
      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 tracking-wide">
        {icon} {label}
      </label>
      <div
        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors"
        onClick={onToggle}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && (
        <div className="absolute z-20 top-full left-0 w-full mt-1 bg-[#161B26] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          {options.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 text-sm text-white hover:bg-[#FF512F]/10 cursor-pointer transition-colors"
              onClick={() => onSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function JoiningOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10 gap-4">
      <Spinner className="w-10 h-10 border-t-2 border-b-2 border-[#FF512F]" />
      <p className="text-white/60 text-sm font-medium">Joining session…</p>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <p className="text-sm text-red-300 font-medium leading-snug">{message}</p>
      </div>
      <button
        className="shrink-0 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer border border-red-500/30 shadow-sm"
        onClick={onRetry}
      >
        <RefreshCw className="w-3.5 h-3.5" /> Try Again
      </button>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function SessionEntryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queueEntryId = useMemo(() => localStorage.getItem("queue_entry_id"), []);

  // Local device prefs (camera / mic toggles, dropdowns)
  const [localSetup, setLocalSetup] = useState<LocalSetupState>({
    cameraOn: true,
    micOn: true,
    selectedCamera: "Integrated Webcam (Default)",
    selectedMic: "Built-in Microphone (Default)",
    isCameraOpen: false,
    isMicOpen: false,
  });

  // Page-level state machine
  // 'setup' → 'live' → 'left' (disconnected/left) → 'ended_by_host' → 'finalized'
  const [pageState, setPageState] = useState<"setup" | "live" | "left" | "ended_by_host" | "finalized">("setup");
  const [isSessionStarted, setIsSessionStarted] = useState<boolean | null>(null);

  // Ref for the Daily.co iframe container
  const dailyContainerRef = useRef<HTMLDivElement | null>(null);

  const companyName =
    slug && slug !== ":" ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Platform";

  // ── Daily session hook ───────────────────────────────────────────────────
  const { status: dailyStatus, error: dailyError, joinSession, leaveSession } = useDailySession({
    containerRef: dailyContainerRef,
    onJoined: () => setPageState("live"),
    onLeft: () => {
      // If we left ourselves (or disconnected), go to 'left'. 
      // If the host ended it, the realtime event handles 'ended_by_host'.
      setPageState((prev) => (prev === "live" ? "left" : prev));
    },
    onError: () => {
      // keep pageState at 'live' so the error banner shows inside the live view
    },
  });

  const isFetching = dailyStatus === "fetching";
  const isInCall = dailyStatus === "joined";

  // ── Initial Check ────────────────────────────────────────────────────────
  useEffect(() => {
    const checkSessionReady = async () => {
      try {
        const token = localStorage.getItem("participant_token");
        if (!token) return;

        const queueData = await participantApi.getQueueStatus(token);
        const status = queueData?.status?.toLowerCase();

        // Session is only for post-admission flow (email tab), not waiting room
        if (status === "waiting" || status === "called") {
          navigate(`/company/${slug}/status`, { replace: true });
          return;
        }

        if (
          status === "resolved" ||
          status === "declined" ||
          status === "pending_review" ||
          status === "pending review"
        ) {
          setPageState("finalized");
          return;
        }
        if (status === "pending_outcome") {
          setPageState("ended_by_host");
          return;
        }

        // Attempt to pre-fetch the session video URL.
        // If it succeeds, the host has already started it!
        await participantApi.getSessionVideo(token);
        setIsSessionStarted(true);
      } catch (err) {
        setIsSessionStarted(false);
      }
    };
    if (pageState === "setup") {
      checkSessionReady();
    }
  }, [pageState, navigate, slug]);

  // ── Realtime events ──────────────────────────────────────────────────────
  useRealtimeChannel(queueEntryId ? `queue_entry:${queueEntryId}` : null, {
    session_started: () => {
      setIsSessionStarted(true);
    },
    session_ended: () => {
      leaveSession();
      setPageState("ended_by_host");
    },
    outcome_saved: () => {
      setPageState("finalized");
    },
  });

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleEnterInterview = useCallback(() => {
    setPageState("live");
    joinSession();
  }, [joinSession]);

  const handleLeave = useCallback(() => {
    leaveSession();
  }, [leaveSession]);


  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none" />

      <ParticipantHeader companyName={companyName} />

      <div
        className={`flex-1 relative z-10 w-full flex flex-col items-center justify-start ${pageState === "live" ? "p-0 sm:p-4" : "p-4 py-6"
          }`}
      >
        {/* ── SETUP VIEW ─────────────────────────────────────────────────── */}
        {pageState === "setup" && (
          <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-5 my-auto">
            {/* Left: preview area */}
            <div className="md:col-span-3 bg-black/60 p-6 flex flex-col justify-between min-h-[250px] md:min-h-[400px] border-r border-white/5">
              <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF512F]" />
                <span>Private Preview</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                {localSetup.cameraOn ? (
                  <div className="text-white/20 text-xs font-medium border border-white/5 px-3 py-1.5 rounded-lg bg-white/5">
                    Camera feed active (Simulated)
                  </div>
                ) : (
                  <div className="text-white/20 text-xs font-medium border border-white/5 px-3 py-1.5 rounded-lg bg-black/50">
                    Camera is turned off
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-3">
              </div>
            </div>

            {/* Right: settings */}
            <div className="md:col-span-2 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-1">
                <h1 className="text-lg font-black text-white tracking-tight">Ready to Join?</h1>
                <p className="text-xs text-gray-500 font-medium">
                  Check your audio and video settings before entering.
                </p>
              </div>

              <div className="space-y-4">
                <DeviceDropdown
                  label="Camera"
                  icon={<Video className="w-3.5 h-3.5" />}
                  value={localSetup.selectedCamera}
                  options={["Integrated Webcam (Default)", "External USB Camera"]}
                  isOpen={localSetup.isCameraOpen}
                  onToggle={() =>
                    setLocalSetup((s) => ({
                      ...s,
                      isCameraOpen: !s.isCameraOpen,
                      isMicOpen: false,
                    }))
                  }
                  onSelect={(v) =>
                    setLocalSetup((s) => ({ ...s, selectedCamera: v, isCameraOpen: false }))
                  }
                />
                <DeviceDropdown
                  label="Microphone"
                  icon={<Mic className="w-3.5 h-3.5" />}
                  value={localSetup.selectedMic}
                  options={["Built-in Microphone (Default)", "External USB Microphone"]}
                  isOpen={localSetup.isMicOpen}
                  onToggle={() =>
                    setLocalSetup((s) => ({
                      ...s,
                      isMicOpen: !s.isMicOpen,
                      isCameraOpen: false,
                    }))
                  }
                  onSelect={(v) =>
                    setLocalSetup((s) => ({ ...s, selectedMic: v, isMicOpen: false }))
                  }
                />
              </div>

              <div className="space-y-3">
                <button
                  id="enter-interview-btn"
                  disabled={!isSessionStarted || isFetching || dailyStatus === "joining"}
                  className={`w-full text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg text-sm ${!isSessionStarted || isFetching || dailyStatus === "joining"
                    ? "bg-gray-600 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] shadow-[#FF512F]/10 hover:shadow-[#FF512F]/20 transform hover:scale-[1.01] cursor-pointer"
                    }`}
                  onClick={handleEnterInterview}
                >
                  {isSessionStarted === null ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking session...</span>
                    </>
                  ) : !isSessionStarted ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="text-amber-100">Waiting for host to start...</span>
                    </>
                  ) : isFetching || dailyStatus === "joining" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Interview</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="text-[10px] text-gray-600 font-medium flex items-center justify-center gap-1">
                  <Settings className="w-3 h-3" />
                  <span>Settings will be saved for future sessions.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/*  LIVE VIEW */}
        {pageState === "live" && (
          <div className="w-full flex-1 bg-black sm:border sm:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            {/* Daily.co iframe container */}
            <div className="flex-1 relative w-full h-full sm:min-h-[500px]">
              {/* Joining spinner overlay */}
              {isFetching && <JoiningOverlay />}

              {/* The actual Daily.co iframe mounts here */}
              <div
                ref={dailyContainerRef}
                id="daily-video-container"
                className="absolute inset-0 w-full h-full"
              />

              {/* Error state within live view */}
              {dailyStatus === "error" && dailyError && (
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/60 z-20">
                  <div className="w-full max-w-sm space-y-4">
                    <ErrorBanner message={dailyError} onRetry={joinSession} />
                  </div>
                </div>
              )}
            </div>

            {/* Controls bar */}
            <div className="p-4 bg-[#0B0F19] border-t border-white/5 flex justify-center gap-4 flex-shrink-0 z-10 relative">
              {/* Leave button — only show once in the call */}
              {isInCall && (
                <button
                  id="leave-session-btn"
                  className="px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer flex items-center gap-2 transform hover:scale-[1.02]"
                  onClick={handleLeave}
                  title="Leave Session"
                >
                  <PhoneOff className="w-5 h-5" />
                  Leave Interview
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── LEFT EARLY / DISCONNECTED VIEW ─────────────────────────────── */}
        {pageState === "left" && (
          <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-8 text-center my-auto space-y-6">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto border border-gray-700">
              <PhoneOff className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Disconnected</h1>
              <p className="text-sm text-gray-400 font-medium">
                You have left the session or lost connection. The host might still be waiting for you.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer text-sm shadow-lg shadow-red-500/20"
                onClick={() => setPageState("setup")}
              >
                Rejoin Session
              </button>
              <button
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer text-sm"
                onClick={() => navigate(`/company/${slug}`)}
              >
                Return to Jobs Page
              </button>
            </div>
          </div>
        )}

        {/* ── ENDED BY HOST VIEW ─────────────────────────────────────────── */}
        {pageState === "ended_by_host" && (
          <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-8 text-center my-auto space-y-6">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto border border-gray-700">
              <PhoneOff className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Interview Completed</h1>
              <p className="text-sm text-gray-400 font-medium">
                The host has ended the session. Please do not close this window yet.
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg text-sm font-medium text-left flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Waiting for the host to finalize the outcome. Once finalized, you'll be able to
                return to the jobs page.
              </p>
            </div>
          </div>
        )}

        {/* ── FINALIZED VIEW ─────────────────────────────────────────────── */}
        {pageState === "finalized" && (
          <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-8 text-center my-auto space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 relative z-10">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">You're All Set!</h1>
              <p className="text-sm text-gray-400 font-medium">
                The outcome for your interview has been recorded.
              </p>
            </div>
            <div className="pt-2">
              <button
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer text-sm"
                onClick={() => navigate(`/company/${slug}`)}
              >
                Return to Jobs Page
              </button>
            </div>
          </div>
        )}
      </div>

      {pageState !== "live" && <ParticipantFooter />}
    </div>
  );
}
