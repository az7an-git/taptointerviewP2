import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ClipboardCheck, ArrowRight, ArrowLeft, Building2, Clock, PauseCircle, XCircle } from "lucide-react";
import { ParticipantFooter, ParticipantHeader } from "../components";
import { jobsApi } from "@/api/jobsApi";
import { Spinner } from "@/common/ui/Spinner";
import RadioGroup from "@/common/components/ui/RadioGroup";
import { markScreeningStepComplete } from "@/routes/participantSession";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

export default function ScreeningQuestionsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [queueClosedStatus, setQueueClosedStatus] = useState<string | null>(null);

  const jobId = localStorage.getItem("selectedJobId");

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

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!slug || !jobId) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await jobsApi.getJobDetailsByCompany(slug, jobId);
        if (response.status === "success" && response.data?.job?.screening_questions) {
          const sortedQuestions = response.data.job.screening_questions.sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          );
          setQuestions(sortedQuestions);
          // Initialize answers — null for dropdowns, empty string for text
          const initialAnswers: Record<string, number | string> = {};
          sortedQuestions.forEach((q: any) => {
            initialAnswers[q.id] = (q.options || []).length > 0 ? -1 : "";
          });
          setAnswers(initialAnswers);
        }
      } catch (err: any) {
        console.error("Failed to load screening questions", err);
        setError("Failed to load screening questions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [slug, jobId]);

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

  const handleSubmitQuestions = async () => {
    if (!slug || !jobId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payloadAnswers = questions.map((q) => {
        const sortedOptions = (q.options || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        );

        if (sortedOptions.length > 0) {
          const selectedIdx = typeof answers[q.id] === 'number' ? answers[q.id] as number : 0;
          return {
            question_id: q.id,
            selected_option_index: selectedIdx >= 0 ? selectedIdx : 0,
          };
        } else {
          return {
            question_id: q.id,
            answer_text: (answers[q.id] as string) || "",
          };
        }
      });

      const response = await jobsApi.submitScreeningAnswers(slug, jobId, payloadAnswers);

      if (response.status === "success" && response.data) {
        if (!response.data.passed) {
          setError("Unfortunately, based on your responses, you do not meet the minimum qualifications required for this role.");
          return;
        }

        localStorage.setItem("screening_token", response.data.screening_token);
        localStorage.setItem("screening_attempt_id", response.data.screening_attempt_id);
        markScreeningStepComplete();

        setIsSuccess(true);
      } else {
        throw new Error("Failed to submit answers");
      }
    } catch (err: any) {
      console.error("Submission failed", err);
      const backendMessage: string | undefined = err.response?.data?.data;
      if (backendMessage) {
        setError(backendMessage);
      } else {
        setError("Failed to submit answers. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Moved overflow-y-auto here to make the whole page scroll normally
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none"></div>

      <ParticipantHeader companyName={companyName} />

      {/* Main Content - Flex-1 pushes footer down if content is short */}
      <div className="flex-1 p-4 relative z-10 w-full flex flex-col items-center justify-start py-6">
        <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-5 mt-6 md:mt-12 mb-auto">
          {/* Left Side: Information / Intro (2/5 columns) */}
          <div className="md:col-span-2 bg-gradient-to-br from-black/80 to-black/40 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
            {/* Background pattern/glow specific to left side */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF512F] opacity-10 blur-2xl rounded-full pointer-events-none"></div>

            <div className="space-y-6 relative z-10">
              <button
                className="flex items-center gap-1 text-[#FF512F] hover:text-[#FF7A00] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                onClick={() =>
                  jobId ? navigate(`/company/${slug}/job/${jobId}`) : navigate(`/company/${slug}`)
                }
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-white/55 text-[10px] font-bold uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5 text-[#FF512F]" />
                  <span>{companyName} Waiting Room</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">{jobTitle}</h1>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClipboardCheck className="w-4 h-4 text-[#FF512F]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">Quick Qualification</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Please answer the qualification questions. These help the recruiters understand your current availability and alignment with the role.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">Join the Waiting Room</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Submitting your answers places you directly in the waiting room. Wait times depend on live interviewer availability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ArrowRight className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">Next Up: Device Setup</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Immediately after joining, you can test your video and audio devices before going live.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block pt-6 text-[10px] text-gray-500 font-medium border-t border-white/5 mt-6 relative z-10">
              Your details will only be visible to {companyName}'s hiring team.
            </div>
          </div>

          {/* Right Side: Form (3/5 columns) */}
          <div className="md:col-span-3 p-6 flex flex-col justify-center">
            {/* Form header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Pre-Interview Qualification</h2>
              <p className="text-xs text-gray-400 font-medium mt-1">Please fill in the quick questionnaire below to join the waiting room.</p>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Spinner className="w-8 h-8 border-3 border-[#FF512F] border-t-transparent" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider animate-pulse">Loading questions...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm font-medium">
                {error ? (
                  <span className="text-red-400">{error}</span>
                ) : (
                  <>
                    No qualification questions required for this role.
                    <div className="pt-6">
                      <button
                        className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF512F]/10 hover:shadow-[#FF512F]/20 transform hover:scale-[1.01] cursor-pointer text-sm"
                        onClick={() => {
                          markScreeningStepComplete();
                          navigate(`/company/${slug}/details`);
                        }}
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Next Step: Your Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : isSuccess ? (
              <div className="py-12 text-center text-emerald-400 text-sm font-medium">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
                Congratulations! You meet the basic qualifications for this role.
                <div className="pt-6">
                  <button
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transform hover:scale-[1.01] cursor-pointer text-sm"
                    onClick={() => navigate(`/company/${slug}/details`)}
                  >
                    <span>Continue to Contact Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="space-y-5">
                  {questions.map((q, questionIndex) => {
                    const sortedOptions = (q.options || []).sort(
                      (a: any, b: any) => a.sort_order - b.sort_order
                    );

                    return (
                      <div
                        key={q.id}
                        role="group"
                        aria-labelledby={`screening-question-${q.id}`}
                        className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.03] min-w-0"
                      >
                        <div className="px-4 py-3.5 border-b border-white/10 bg-gradient-to-br from-[#FF512F]/10 via-white/[0.04] to-transparent">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00]">
                            Question {questionIndex + 1}
                          </span>
                          <h3
                            id={`screening-question-${q.id}`}
                            className="mt-1.5 text-base font-bold text-white leading-snug break-words"
                          >
                            {q.text}
                          </h3>
                        </div>

                        <div className="px-4 py-3.5">
                          {sortedOptions.length > 0 ? (
                            <>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                                Choose one answer
                              </p>
                              <RadioGroup
                                label={q.text}
                                name={`screening-${q.id}`}
                                variant="ghost"
                                hideLabel
                                disabled={isSubmitting}
                                options={sortedOptions.map((opt: { text: string }, idx: number) => ({
                                  value: String(idx),
                                  label: opt.text,
                                }))}
                                value={
                                  typeof answers[q.id] === "number" && (answers[q.id] as number) >= 0
                                    ? String(answers[q.id])
                                    : ""
                                }
                                onChange={(val) =>
                                  setAnswers({ ...answers, [q.id]: Number(val) })
                                }
                                className="[&_label]:pl-3 [&_label]:border-l-2 [&_label]:border-l-white/5 [&_label:has(:checked)]:border-l-[#FF512F]/60"
                              />
                            </>
                          ) : (
                            <>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                                Your answer
                              </p>
                              <div className="relative">
                                <ClipboardCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                <input
                                  type="text"
                                  value={answers[q.id] || ""}
                                  disabled={isSubmitting}
                                  onChange={(e) =>
                                    setAnswers({ ...answers, [q.id]: e.target.value })
                                  }
                                  placeholder="Type your answer..."
                                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF512F] focus:ring-1 focus:ring-[#FF512F]/45 focus:caret-[#FF512F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    {queueClosedStatus && (
                      <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3">
                        {queueClosedStatus === "paused" ? (
                          <PauseCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <p className="text-xs font-medium text-amber-300 leading-snug">
                          {queueClosedStatus === "paused"
                            ? "The queue has been paused by the host. You can still submit, but joining may be delayed."
                            : "This position is no longer accepting applications. Submitting will likely be rejected."}
                        </p>
                      </div>
                    )}
                    <button
                      className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF512F]/10 hover:shadow-[#FF512F]/20 transform hover:scale-[1.01] cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      onClick={handleSubmitQuestions}
                      disabled={isSubmitting || !questions.every((q) => {
                        const ans = answers[q.id];
                        return (q.options || []).length > 0
                          ? typeof ans === 'number' && ans >= 0
                          : typeof ans === 'string' && ans.trim() !== '';
                      })}
                    >
                      {isSubmitting ? (
                        <Spinner className="w-4 h-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <ClipboardCheck className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? "Submitting..." : "Next Step: Your Details"}</span>
                      {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                    <div
                      className="min-h-[2.25rem] mt-2 flex items-center justify-center"
                      aria-live="polite"
                    >
                      <p
                        role={error ? "alert" : undefined}
                        className={`w-full text-[11px] leading-snug text-center px-2.5 py-1.5 rounded-md border transition-opacity duration-200 ${error
                          ? "opacity-100 text-red-400/95 bg-red-500/10 border-red-500/25"
                          : "opacity-0 border-transparent pointer-events-none"
                          }`}
                      >
                        {error || "\u00a0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Pushed to bottom of flow, appears on scroll if content is tall */}
      <ParticipantFooter />
    </div>
  );
}
