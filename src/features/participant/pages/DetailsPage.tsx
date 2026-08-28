import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Mail, ShieldCheck, UserPlus, PauseCircle, XCircle, Info, PhoneCall, CheckCircle2, Lock, Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ParticipantTwoPanelLayout } from "../components";
import { getParticipantErrorMessage } from "../utils/participantErrorMessage";
import { jobsApi } from "@/api/jobsApi";
import { Spinner } from "@/common/ui/Spinner";
import { PhoneInput } from "@/common/ui/PhoneInput";
import { OtpInput } from "@/common/ui/OtpInput";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { isValidPhoneNumber } from "@/common/utils/phone";
import { PhoneVerificationStatus } from "@/types/job";

export default function DetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(true);
  const [termsConsent, setTermsConsent] = useState(false);
  const [queueClosedStatus, setQueueClosedStatus] = useState<string | null>(null);

  // Phone OTP Verification States
  const [verificationState, setVerificationState] = useState<PhoneVerificationStatus | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const resendTimerRef = useRef<any>(null);

  const companyName = localStorage.getItem("selectedCompanyName") || (slug && slug !== ":"
    ? slug.charAt(0).toUpperCase() + slug.slice(1).split("-")[0]
    : "Platform");

  const jobTitle = localStorage.getItem("selectedJobTitle") || "Candidate Interview Room";

  useEffect(() => {
    document.title = `${jobTitle} | ${companyName}`;
    return () => {
      document.title = "Tap To Interview";
    };
  }, [jobTitle, companyName]);

  const hasPhoneInput = Boolean(details.phone && isValidPhoneNumber(details.phone));

  // Reset SMS consent if phone is cleared
  useEffect(() => {
    if (!hasPhoneInput) {
      setSmsConsent(false);
    }
  }, [details.phone, hasPhoneInput]);

  const jobId = localStorage.getItem("selectedJobId");
  const screeningToken = localStorage.getItem("screening_token");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend Timer logic
  useEffect(() => {
    if (resendSeconds > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendSeconds((prev) => prev - 1);
      }, 1000);
    } else if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, [resendSeconds]);

  useRealtimeChannel(jobId ? `job:${jobId}` : null, {
    queue_status_changed: (payload: any) => {
      const status: string | undefined = payload?.queue_status;
      if (status && status !== "open") {
        setQueueClosedStatus(status);
      } else if (status === "open") {
        setQueueClosedStatus(null);
      }
    },
  });

  const extractVerificationPayload = (res: any): PhoneVerificationStatus | null => {
    if (!res) return null;
    if (res.data && typeof res.data === "object" && "verification_attempts_remaining" in res.data) {
      return res.data;
    }
    if (typeof res === "object" && "verification_attempts_remaining" in res) {
      return res as PhoneVerificationStatus;
    }
    return res.data || res;
  };

  // Request SMS OTP
  const handleRequestOtp = async () => {
    if (!slug || !jobId || !screeningToken) {
      toast.error("Missing screening session details. Please retake the screening questions.");
      return;
    }
    if (!isValidPhoneNumber(details.phone)) {
      toast.error("Please enter a valid, complete mobile phone number.");
      return;
    }

    setIsRequestingOtp(true);
    try {
      const res = await jobsApi.requestPhoneVerification(slug, jobId, details.phone, screeningToken);
      const payload = extractVerificationPayload(res);
      if (payload) {
        setVerificationState({
          ...payload,
          phone_verification_pending: true,
          verified_phone: details.phone,
        });
      }
      setResendSeconds(30);
      toast.success("6-digit verification code sent to your phone via SMS!");
    } catch (err: any) {
      toast.error(getParticipantErrorMessage(err, "Failed to send verification SMS. Ensure number is mobile-capable."));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Resend SMS OTP
  const handleResendOtp = async () => {
    if (!slug || !jobId || !screeningToken) return;
    if (resendSeconds > 0) return;

    setIsResendingOtp(true);
    try {
      const res = await jobsApi.resendPhoneVerification(slug, jobId, screeningToken);
      const payload = extractVerificationPayload(res);
      // Merge into existing state — resend endpoint may not return all fields
      // (e.g. verification_attempts_remaining), so preserve them from prev state
      setVerificationState((prev) => ({
        ...(prev || {} as any),
        ...(payload || {}),
        phone_verification_pending: true,
        verified_phone: details.phone,
      }));
      setResendSeconds(30);
      setOtpCode("");
      toast.success("A new verification code has been sent!");
    } catch (err: any) {
      toast.error(getParticipantErrorMessage(err, "Failed to resend code. Please try again."));
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!slug || !jobId || !screeningToken || otpCode.length !== 6) return;

    setIsVerifyingOtp(true);
    try {
      const res = await jobsApi.verifyPhoneCode(slug, jobId, otpCode, screeningToken);
      const payload = extractVerificationPayload(res);
      if (payload) {
        setVerificationState(payload);
        if (payload.phone_verified_at) {
          toast.success("Phone number verified successfully!");
        } else if (payload.phone_verification_locked) {
          toast.error("Account locked due to 5 failed attempts. Please contact support or try later.");
        }
      }
    } catch (err: any) {
      const errMsg = getParticipantErrorMessage(err, "Invalid verification code. Please check and try again.");
      toast.error(errMsg);
      setOtpCode("");

      // Extract attempts remaining from backend error message or response payload
      const attemptsMatch = errMsg.match(/(\d+)\s+attempts?\s+remaining/i);
      const remainingFromPayload = err?.response?.data?.verification_attempts_remaining ?? err?.response?.data?.data?.verification_attempts_remaining;

      let remaining: number | undefined;
      if (errMsg.toLowerCase().includes("too many failed attempts") || errMsg.toLowerCase().includes("different phone number")) {
        remaining = 0;
      } else if (typeof remainingFromPayload === "number") {
        remaining = remainingFromPayload;
      } else if (attemptsMatch) {
        remaining = parseInt(attemptsMatch[1], 10);
      }

      if (typeof remaining === "number") {
        setVerificationState((prev) => prev ? ({
          ...prev,
          phone_verification_pending: true,
          verification_attempts_remaining: remaining,
          phone_verification_locked: remaining <= 0,
        }) : {
          verified_phone: details.phone,
          phone_verification_pending: true,
          phone_verification_locked: remaining <= 0,
          verification_attempts_remaining: remaining,
          phone_verified_at: null,
          verification_expires_at: null,
          resend_available_at: null,
        });
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const isPhoneVerified = Boolean(verificationState?.phone_verified_at);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !jobId) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(details.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Consent validation: At least one of SMS or Email consent required
    if (!smsConsent && !emailConsent) {
      toast.error("Mandatory Channel Selection: You must choose at least one active contact channel (SMS or Email) to join the queue.");
      return;
    }

    // Let backend handle the phone verification rules so backend messages are displayed directly

    setIsSubmitting(true);

    try {
      const response = await jobsApi.joinQueue(slug, jobId, {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        email: details.email.trim(),
        phone: details.phone ? details.phone.trim() : undefined,
        sms_consent: smsConsent,
        email_consent: emailConsent,
      }, screeningToken || undefined);

      if (response.status === "success" && response.data) {
        localStorage.setItem("participant_token", response.data.participant_token);
        localStorage.setItem("queue_entry_id", response.data.queue_entry_id);
        localStorage.setItem("queue_position", String(response.data.position));
        navigate(`/company/${slug}/status`);
      } else {
        throw new Error("Failed to join queue");
      }
    } catch (err: any) {
      toast.error(getParticipantErrorMessage(err, "Failed to join the queue. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftPanel = (
    <>
      <div className="space-y-6 relative z-10">
        <button
          type="button"
          className="flex items-center gap-1 text-[#FF512F] hover:text-[#FF7A00] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-white/55 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF512F]" />
            <span>Step 2: Profile & Verification</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">Contact & Profile Setup</h1>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <p className="text-sm text-gray-300 leading-relaxed">
            You passed the qualification check! Complete your profile and verify your phone number to enter the waiting room.
          </p>

          {/* Candidate Guidance Banner 2 */}
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
              Verification codes may take a moment to arrive and can land in spam/junk folders. Please check your messages carefully.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200/80 leading-relaxed">
              At least one contact method (SMS or Email) must be enabled so we can notify you when your turn arrives.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden md:block pt-6 text-[10px] text-gray-500 font-medium border-t border-white/5 mt-6 relative z-10">
        End-to-end secure session.
      </div>
    </>
  );

  const rightPanel = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#FF512F]" />
            First Name
          </label>
          <div className="mt-1.5 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={details.firstName}
              onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
              placeholder="e.g. Jane"
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#FF512F]" />
            Last Name
          </label>
          <div className="mt-1.5 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={details.lastName}
              onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
              placeholder="e.g. Doe"
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 transition-all disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-[#FF512F]" />
          Email Address
        </label>
        <div className="mt-1.5 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="email"
            required
            disabled={isSubmitting}
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            placeholder="jane@example.com"
            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Phone Input with Twilio SMS OTP Integration */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="participant-phone" className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#FF512F]" />
            Mobile Phone Number
          </label>
          {isPhoneVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:flex-1 min-w-0">
            <PhoneInput
              id="participant-phone"
              disabled={isSubmitting || isPhoneVerified}
              value={details.phone}
              onChange={(phone) => {
                setDetails({ ...details, phone });
                if (verificationState) setVerificationState(null);
              }}
            />
          </div>

          {hasPhoneInput && !isPhoneVerified && (
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isRequestingOtp || isSubmitting || Boolean(verificationState?.phone_verification_pending)}
              className="w-full sm:w-auto px-4 py-2.5 font-bold text-xs rounded-lg transition-all border border-white/15 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRequestingOtp ? (
                <Spinner className="w-3.5 h-3.5 border-t-2 border-b-2 border-white shrink-0" />
              ) : verificationState?.phone_verification_pending ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{isRequestingOtp ? "Sending..." : verificationState?.phone_verification_pending ? "Code Sent" : "Send OTP"}</span>
            </button>
          )}
        </div>

        {/* 6-Digit OTP Input Form Section */}
        {verificationState?.phone_verification_pending && !isPhoneVerified && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 sm:p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">Enter 6-Digit SMS Code</span>
            </div>

            {/* Reusable OtpInput component */}
            <OtpInput
              value={otpCode}
              onChange={(val) => setOtpCode(val)}
              disabled={isVerifyingOtp || verificationState.phone_verification_locked}
            />

            {verificationState.phone_verification_locked ? (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Too many failed attempts. Enter a different number.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 pb-1 border-t border-white/5">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-[11px] sm:text-[12px] text-gray-400 leading-normal">
                    Attempts remaining: {verificationState.verification_attempts_remaining ?? 5}
                  </span>
                  {resendSeconds > 0 ? (
                    <span className="text-[10px] sm:text-[12px] text-gray-400 flex items-center gap-1 whitespace-nowrap leading-normal">
                      <Clock className="w-3 h-3 text-[#FF512F] shrink-0" /> Resend in {resendSeconds}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResendingOtp || isRequestingOtp}
                      className="text-[10px] sm:text-[12px] font-bold text-[#FF512F] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap disabled:opacity-50 leading-normal"
                    >
                      {isResendingOtp ? (
                        <Spinner className="w-3 h-3 border-t-2 border-b-2 border-[#FF512F] shrink-0" />
                      ) : (
                        <RotateCcw className="w-3 h-3 shrink-0" />
                      )}
                      <span>{isResendingOtp ? "Resending..." : "Resend Code"}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="w-full sm:w-auto px-4 py-1.5 border border-[#FF512F]/30 bg-[#FF512F]/10 hover:bg-[#FF512F]/20 disabled:hover:bg-[#FF512F]/10 disabled:opacity-50 text-[#FF512F] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isVerifyingOtp && <Spinner className="w-3 h-3 border-t-2 border-b-2 border-white shrink-0" />}
                  <span>Verify</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mandatory Channel & Consent Rules */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-start pt-0.5">
            <input
              type="checkbox"
              disabled={isSubmitting}
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
              className="peer appearance-none w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-[#FF512F] checked:border-[#FF512F] focus:outline-none transition-all cursor-pointer"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
              <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                <polyline points="3 7.5 5.5 10 11 4"></polyline>
              </svg>
            </div>
          </div>
          <span className="text-xs text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
            I agree to receive email notifications regarding queue status and interview links. {!smsConsent && <strong className="text-amber-400 font-medium">(Mandatory channel when SMS is off)</strong>}
          </span>
        </label>

        <label className={`flex items-start gap-3 group ${!hasPhoneInput ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
          <div className="relative flex items-start pt-0.5">
            <input
              type="checkbox"
              disabled={isSubmitting || !hasPhoneInput}
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="peer appearance-none w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-[#FF512F] checked:border-[#FF512F] focus:outline-none transition-all cursor-pointer"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
              <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                <polyline points="3 7.5 5.5 10 11 4"></polyline>
              </svg>
            </div>
          </div>
          <span className={`text-xs text-gray-400 leading-snug transition-colors ${!hasPhoneInput ? "" : "group-hover:text-gray-300"}`}>
            I agree to receive automated SMS notifications regarding my interview turn. Reply STOP to opt out.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-start pt-0.5">
            <input
              type="checkbox"
              required
              disabled={isSubmitting}
              checked={termsConsent}
              onChange={(e) => setTermsConsent(e.target.checked)}
              className="peer appearance-none w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-[#FF512F] checked:border-[#FF512F] focus:outline-none transition-all cursor-pointer"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
              <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                <polyline points="3 7.5 5.5 10 11 4"></polyline>
              </svg>
            </div>
          </div>
          <span className="text-xs text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
            I agree to the Terms of Use and Privacy Policy.
          </span>
        </label>
      </div>

      <div className="pt-4">
        {queueClosedStatus && (
          <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
            {queueClosedStatus === "paused" ? (
              <PauseCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-medium text-amber-300 leading-snug">
              {queueClosedStatus === "paused"
                ? "The queue has been paused. You can still submit, but joining may be delayed."
                : "This position is no longer accepting applications. Submitting will likely be rejected."}
            </p>
          </div>
        )}
        {smsConsent && !isPhoneVerified && (
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 transition-all duration-150 ease-out animate-in fade-in slide-in-from-top-1 shadow-sm">
            <PhoneCall className="w-4 h-4 text-[#FF512F] shrink-0" />
            <p className="text-xs font-medium text-amber-200 leading-snug">
              {verificationState?.phone_verification_pending ? (
                <>
                  <strong>Action Required:</strong> Enter the 6-digit verification code sent to your mobile phone into the boxes above.
                </>
              ) : (
                <>
                  <strong>Action Required:</strong> Click the <strong>"Send OTP"</strong> button next to your mobile number above to receive your 6-digit verification code.
                </>
              )}
            </p>
          </div>
        )}
        {(() => {
          const isJoinDisabled = isSubmitting || !termsConsent || (!smsConsent && !emailConsent);
          return (
            <button
              type="submit"
              disabled={isJoinDisabled}
              className={`w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-bold px-4 sm:px-5 py-3.5 rounded-lg transition-all flex items-center justify-center gap-2.5 sm:gap-3 shadow-lg shadow-[#FF512F]/10 text-xs sm:text-sm ${isJoinDisabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:from-[#E04020] hover:to-[#FF512F] hover:shadow-[#FF512F]/20 hover:scale-[1.01] cursor-pointer"
                }`}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 border-t-2 border-b-2 border-white shrink-0" />
                  <span>Joining Queue...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span className="text-center leading-snug min-w-0 flex-1">
                    Join Interview Waiting Room
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          );
        })()}
      </div>
    </form>
  );

  return (
    <ParticipantTwoPanelLayout
      companyName={companyName}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}
