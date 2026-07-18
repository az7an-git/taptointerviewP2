import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Mail, ShieldCheck, UserPlus, PauseCircle, XCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { ParticipantFooter, ParticipantHeader } from "../components";
import { jobsApi } from "@/api/jobsApi";
import { Spinner } from "@/common/ui/Spinner";
import { PhoneInput } from "@/common/ui/PhoneInput";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { isValidPhoneNumber } from "@/common/utils/phone";

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
  const [emailConsent, setEmailConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [queueClosedStatus, setQueueClosedStatus] = useState<string | null>(null);

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

  const hasPhoneInput = Boolean(details.phone && !/^\+\d{1,3}$/.test(details.phone.replace(/\s/g, "")));

  // Reset SMS consent if phone is cleared
  useEffect(() => {
    if (!hasPhoneInput) {
      setSmsConsent(false);
    }
  }, [details.phone, hasPhoneInput]);

  const jobId = localStorage.getItem("selectedJobId");
  const screeningToken = localStorage.getItem("screening_token");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !jobId) return;

    if (!isValidPhoneNumber(details.phone)) {
      toast.error("Please enter a complete phone number after the country code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await jobsApi.joinQueue(slug, jobId, {
        first_name: details.firstName,
        last_name: details.lastName,
        email: details.email,
        phone: details.phone,
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
      const message =
        err.response?.data?.data && typeof err.response.data.data === "string"
          ? err.response.data.data
          : "Failed to join the queue. Please try again.";
      toast.error(message, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none"></div>

      <ParticipantHeader companyName={companyName} />

      {/* Main Content */}
      <div className="flex-1 p-4 relative z-10 w-full flex flex-col items-center justify-start py-6">
        <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-5 my-auto">
          {/* Left Side: Information / Intro (2/5 columns) */}
          <div className="md:col-span-2 bg-gradient-to-br from-black/80 to-black/40 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF512F] opacity-10 blur-2xl rounded-full pointer-events-none"></div>

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
                  <span>Secure Submission</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">Almost There!</h1>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-sm text-gray-300 leading-relaxed">
                  You passed the qualifications. Enter your details to join the interview waiting room.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Your information is only shared with {companyName} and is used to notify you when it's your turn.
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2.5 animate-fade-in">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Please check the required email notifications and terms to continue.
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden md:block pt-6 text-[10px] text-gray-500 font-medium border-t border-white/5 mt-6 relative z-10">
              End-to-end secure session.
            </div>
          </div>

          {/* Right Side: Form (3/5 columns) */}
          <div className="md:col-span-3 p-6 flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">First Name</label>
                  <div className="mt-1.5 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={details.firstName}
                      onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
                      placeholder="e.g. Jordan"
                      className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 focus:caret-[#FF512F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Last Name</label>
                  <div className="mt-1.5 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={details.lastName}
                      onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
                      placeholder="e.g. Mills"
                      className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 focus:caret-[#FF512F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email Address</label>
                <div className="mt-1.5 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    placeholder="you@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 focus:caret-[#FF512F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="participant-phone"
                  className="text-[10px] font-bold text-gray-400 uppercase tracking-wide"
                >
                  Phone Number
                </label>
                <div className="mt-1.5">
                  <PhoneInput
                    id="participant-phone"
                    disabled={isSubmitting}
                    value={details.phone}
                    onChange={(phone) => setDetails({ ...details, phone })}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-start pt-0.5">
                    <input
                      type="checkbox"
                      required
                      disabled={isSubmitting}
                      checked={emailConsent}
                      onChange={(e) => setEmailConsent(e.target.checked)}
                      className="peer appearance-none w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-[#FF512F] checked:border-[#FF512F] focus:outline-none focus:ring-2 focus:ring-[#FF512F]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
                      <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                        <polyline points="3 7.5 5.5 10 11 4"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
                    I agree to receive email notifications from Tap To Interview about my queue position, interview updates, and hiring communications. You can unsubscribe at any time.
                  </span>
                </label>

                <label className={`flex items-start gap-3 group ${!hasPhoneInput ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                  <div className="relative flex items-start pt-0.5">
                    <input
                      type="checkbox"
                      disabled={isSubmitting || !hasPhoneInput}
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="peer appearance-none w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-[#FF512F] checked:border-[#FF512F] focus:outline-none focus:ring-2 focus:ring-[#FF512F]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none text-white">
                      <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 stroke-current stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                        <polyline points="3 7.5 5.5 10 11 4"></polyline>
                      </svg>
                    </div>
                  </div>
                  <span className={`text-xs text-gray-400 leading-snug transition-colors ${!hasPhoneInput ? "" : "group-hover:text-gray-300"}`}>
                    I agree to receive automated SMS notifications from Tap To Interview about my queue position, interview admission links, and hiring communications. Message and data rates may apply. Reply STOP at any time to opt out.
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
                      className="peer appearance-none w-4 h-4 rounded bg-white/5 border border-white/10 checked:bg-[#FF512F] checked:border-[#FF512F] focus:outline-none focus:ring-2 focus:ring-[#FF512F]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button
                  type="submit"
                  disabled={isSubmitting || !termsConsent || !emailConsent}
                  className={`w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-bold px-5 py-3.5 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#FF512F]/10 text-sm ${isSubmitting || !termsConsent || !emailConsent
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:from-[#E04020] hover:to-[#FF512F] hover:shadow-[#FF512F]/20 hover:scale-[1.01] cursor-pointer"
                    }`}
                >
                  {isSubmitting ? (
                    <Spinner className="w-4 h-4 shrink-0 border-2 border-white border-t-transparent" />
                  ) : (
                    <UserPlus className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-center leading-snug min-w-0 flex-1">
                    {isSubmitting ? (
                      "Joining..."
                    ) : (
                      <>
                        <span className="hidden min-[420px]:inline whitespace-nowrap">
                          Join Interview Waiting Room
                        </span>
                        <span className="min-[420px]:hidden">
                          Join Interview
                          <br />
                          Waiting Room
                        </span>
                      </>
                    )}
                  </span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4 shrink-0" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ParticipantFooter />
    </div>
  );
}
