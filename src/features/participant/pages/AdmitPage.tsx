import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, BellRing, AlertTriangle } from "lucide-react";
import { participantApi } from "@/api/participantApi";
import type { InspectResponse } from "@/api/participantApi";
import { ParticipantHeader, ParticipantFooter } from "../components";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

const INVALID_REASON_MESSAGES: Record<string, string> = {
  expired: "Your admission window has expired. You have been returned to the waiting room.",
  used: "This admission link has already been used.",
  invalid: "This admission link is invalid or has been tampered with.",
  invalid_status: "This admission link is no longer valid.",
};

export default function AdmitPage() {
  const [searchParams] = useSearchParams();
  const { slug: slugParam } = useParams();
  const token = searchParams.get("token") ?? "";
  const [queueEntryId, setQueueEntryId] = useState<string | null>(
    () => localStorage.getItem("queue_entry_id")
  );
  const slug = slugParam || localStorage.getItem("selectedCompanySlug") || "";
  const navigate = useNavigate();

  const [inspectData, setInspectData] = useState<InspectResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown from inspect remaining_seconds
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Realtime: participant_missed fires when the admission window expires server-side
  useRealtimeChannel(queueEntryId ? `queue_entry:${queueEntryId}` : null, {
    participant_missed: (payload: any) => {
      const action: string | undefined = payload?.action;
      if (action === "second_miss") {
        // Definitively expired/declined — go to expired page or back to company
        navigate(`/company/${slug ?? ""}`);
      } else {
        // first_miss — back to waiting room
        navigate(`/company/${slug ?? ""}/status`);
      }
    },
  });

  // Inspect on mount
  useEffect(() => {
    if (!token) {
      setError("No admission token found in the URL.");
      setIsInspecting(false);
      return;
    }

    const run = async () => {
      try {
        const result = await participantApi.inspectAdmission(token);
        setInspectData(result);
        if (result.valid) {
          setSecondsLeft(result.remaining_seconds);
          localStorage.setItem("queue_entry_id", result.queue_entry_id);
          setQueueEntryId(result.queue_entry_id);
        }
      } catch {
        setError("Unable to verify your admission link. It may be invalid or expired.");
      } finally {
        setIsInspecting(false);
      }
    };

    run();
  }, [token]);

  // Tick down the countdown
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

  const handleConfirm = useCallback(async () => {
    if (!token || isConfirming) return;
    setIsConfirming(true);
    setError(null);

    try {
      const result = await participantApi.confirmAdmission(token);
      localStorage.setItem("participant_token", result.participant_token);
      localStorage.setItem("queue_entry_id", result.queue_entry_id);
      setQueueEntryId(result.queue_entry_id);

      const targetSlug = slug || localStorage.getItem("selectedCompanySlug");
      if (targetSlug) {
        navigate(`/company/${targetSlug}/session`, { replace: true });
        return;
      }

      setConfirmed(true);
    } catch (err: any) {
      const msg: string | undefined = err.response?.data?.data;
      setError(msg ?? "Failed to confirm your admission. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  }, [token, isConfirming, slug, navigate]);

  const isExpired = secondsLeft === 0;

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF512F] opacity-[0.06] blur-3xl rounded-full pointer-events-none" />

      <ParticipantHeader companyName="Tap To Interview" />

      {/* Main */}
      <div className="flex-1 flex justify-center p-6 pt-20 sm:pt-32 relative z-10">
        <div className="w-full max-w-md">

          {/* Inspecting / Loading */}
          {isInspecting && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-pulse">
              <div className="w-16 h-16 bg-[#FF512F]/10 rounded-full flex items-center justify-center mx-auto border border-[#FF512F]/20">
                <Loader2 className="w-8 h-8 text-[#FF512F] animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF512F]">
                  Authenticating
                </p>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Verifying Link
                </h1>
                <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
                  Please wait while we verify your secure admission token...
                </p>
              </div>
            </div>
          )}

          {/* No token */}
          {!isInspecting && !token && (
            <InvalidState message="No admission token was found in this link. Please check your email and try again." />
          )}

          {/* Generic error (network/inspect fail) */}
          {!isInspecting && error && !inspectData && (
            <InvalidState message={error} />
          )}

          {/* Invalid token from backend */}
          {!isInspecting && inspectData && !inspectData.valid && (
            <InvalidState
              message={INVALID_REASON_MESSAGES[inspectData.reason] ?? "This admission link is no longer valid."}
              reason={inspectData.reason}
            />
          )}

          {/* Valid token: confirm UI */}
          {!isInspecting && inspectData?.valid && !confirmed && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF512F] to-[#FF7A00] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-[#FF512F]/25">
                <BellRing className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF512F]">
                  You've Been Called
                </p>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  The Host is Ready!
                </h1>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  Confirm your admission to join the interview. This link is single-use and expires in&nbsp;
                  <span className={`font-bold tabular-nums ${isExpired ? "text-red-400" : secondsLeft !== null && secondsLeft <= 20 ? "text-red-400" : "text-white"}`}>
                    {isExpired ? "0s" : secondsLeft != null ? `${secondsLeft}s` : "..."}
                  </span>
                </p>
              </div>

              {/* Countdown ring */}
              <div className="flex justify-center">
                <div className={`text-4xl font-black tabular-nums transition-colors ${isExpired ? "text-red-500" : secondsLeft !== null && secondsLeft <= 20 ? "text-red-400" : "text-[#FF512F]"}`}>
                  {isExpired ? "Expired" : secondsLeft != null ? `${secondsLeft}s` : "..."}
                </div>
              </div>

              {/* Expired warning */}
              {isExpired && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 font-medium">
                    Your 90-second window has expired. You may have been moved back to the waiting room. 
                  </p>
                </div>
              )}

              {/* API error after confirm attempt (reserved space to prevent layout jump) */}
              <div className="min-h-[44px] w-full flex items-center">
                {error ? (
                  <div className="w-full bg-red-500/10 border border-red-500/20 rounded-md p-2 text-[11px] leading-snug text-red-400 font-medium text-left flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-[1px]" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <div className="w-full" />
                )}
              </div>

              <button
                id="confirm-admission-btn"
                onClick={handleConfirm}
                disabled={isConfirming || isExpired}
                className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF512F]/20 hover:shadow-[#FF512F]/40 flex items-center justify-center gap-2 transform hover:scale-[1.01] cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{isConfirming ? "Confirming..." : "Confirm Admission"}</span>
              </button>

              <p className="text-[10px] text-gray-600 font-medium">
                This link can only be used once. Do not share it.
              </p>
            </div>
          )}

          {/* Confirmed */}
          {confirmed && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Admission Confirmed
                </p>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  You're In!
                </h1>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  Your spot has been confirmed. Keep this window open — you'll join the interview here when the host starts the session.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ParticipantFooter />
    </div>
  );
}

function InvalidState({ message, reason }: { message: string; reason?: string }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
        <XCircle className="w-8 h-8 text-red-400" />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
          {reason === "expired" ? "Link Expired" : reason === "used" ? "Already Used" : "Invalid Link"}
        </p>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Admission Unavailable
        </h1>
        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
          {message}
        </p>
      </div>
      <button
        onClick={() => navigate("/")}
        className="text-xs font-bold text-[#FF512F] hover:text-[#FF7A00] transition-colors cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  );
}
