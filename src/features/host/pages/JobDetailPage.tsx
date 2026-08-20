import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Archive, Edit, Briefcase, RotateCcw, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/common/ui/PageHeader";
import { Spinner } from "@/common/ui/Spinner";
import { ScreeningQuestionsManager } from "../components/screening-questions";
import { QueueWindowScheduler } from "../components/queue-window-scheduler";
import { JobDetailSkeleton, LiveQueueCard, JobSummaryCard, JobInterviewersManager, JobFunnelMetricsCard, PastApplicantsSection } from "../components";
import { Job, QueueWindow, ScreeningQuestion } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";
import { isDraftJob } from "../utils/postJobWizardStorage";
import { getLiveQueueState, isActiveJobStatus } from "../utils/queueWindowLive";
import { blocksAdmitNext, hasActiveSessionFlow } from "../utils/queueEntryStatus";
import { useJobRealtime } from "@/hooks/useJobRealtime";


let globalJobDetailCache: Record<string, Job> = {};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = useMemo(() => user?.role === 'interviewer' ? '/interviewer' : '/admin', [user?.role]);

  const cachedJob = id ? globalJobDetailCache[id] : null;
  const [job, setJob] = useState<Job | null>(cachedJob || null);
  const [isLoading, setIsLoading] = useState(!cachedJob);
  const [isReopening, setIsReopening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const queueWindowsRef = useRef<HTMLDivElement>(null);
  const [queuePanelHeight, setQueuePanelHeight] = useState<number | null>(null);

  const candidates = useMemo(() => {
    if (!job?.applicants) return [];
    return job.applicants.map((app) => ({
      id: app.queueEntryId,
      name: `${app.participant.firstName || ""} ${app.participant.lastName || ""}`.trim(),
      status: app.status.charAt(0).toUpperCase() + app.status.slice(1).toLowerCase(),
      joinTime: app.joinedAt
        ? new Date(app.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Unknown",
      avatar: (app.participant.firstName?.[0] || "?").toUpperCase(),
      admissionExpiresAt: app.admissionExpiresAt ?? null,
      outcome: app.outcome,
      raw: app,
    }));
  }, [job?.applicants]);

  const activeCandidatesCount = useMemo(() => {
    const activeStatuses = ["waiting", "called", "admitted", "confirmed", "in_session", "pending_outcome"];
    return candidates.filter((c) => activeStatuses.includes(c.raw?.status?.toLowerCase() || "")).length;
  }, [candidates]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      if (!globalJobDetailCache[id]) {
        setIsLoading(true);
      }
      try {
        const response = await jobsApi.getJob(id);
        setJob(response.data);
        globalJobDetailCache[id] = response.data;
      } catch (error) {
        console.error("Failed to load job details from API:", error);
        toast.error("Failed to load job details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    if (!job || !id) return;
    if (isDraftJob(job.status)) {
      navigate(`${basePath}/jobs/post?draft=${id}`, { replace: true });
    }
  }, [job, id, basePath, navigate]);

  const refreshJob = useCallback(async () => {
    if (!id) return;
    try {
      const response = await jobsApi.getJob(id);
      setJob(response.data);
      globalJobDetailCache[id] = response.data;
    } catch {
    }
  }, [id]);

  useJobRealtime(id, refreshJob);

  const needsLivePoll =
    (job?.applicants?.some((a) => blocksAdmitNext(a.status)) ?? false) ||
    hasActiveSessionFlow(job?.applicants);
  useEffect(() => {
    if (!id || !needsLivePoll) return;
    const poll = async () => {
      try {
        const response = await jobsApi.getJob(id);
        setJob(response.data);
      } catch {
      }
    };
    const interval = setInterval(poll, 50_000);
    return () => clearInterval(interval);
  }, [id, needsLivePoll]);

  useEffect(() => {
    const el = queueWindowsRef.current;
    if (!el) return;

    const mq = window.matchMedia("(min-width: 1024px)");

    const syncHeight = () => {
      if (!mq.matches) {
        setQueuePanelHeight(null);
        return;
      }
      setQueuePanelHeight(el.offsetHeight);
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    mq.addEventListener("change", syncHeight);
    window.addEventListener("resize", syncHeight);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", syncHeight);
      window.removeEventListener("resize", syncHeight);
    };
  }, [job?.queueWindows, job?.applicants, job?.status]);

  const handleStatusChange = async (newStatus: Job["status"]) => {
    if (!job) return;
    if (newStatus === "Closed") setIsClosing(true);
    try {
      let response;
      if (newStatus === "Closed") {
        response = await jobsApi.closeJob(id!);
      } else {
        response = await jobsApi.updateJob(id!, { status: newStatus });
      }
      setJob(response.data);
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error(`Failed to update status to ${newStatus} on API, updating locally:`, error);
      setJob({ ...job, status: newStatus });
      toast.success(`Job status updated to ${newStatus}`);
    } finally {
      if (newStatus === "Closed") setIsClosing(false);
    }
  };

  const handleReopenJob = async () => {
    if (!id) return;
    setIsReopening(true);
    try {
      const response = await jobsApi.reopenJob(id);
      setJob(response.data);
      toast.success("Job reopened successfully.");
    } catch (error) {
      console.error("Failed to reopen job:", error);
      toast.error("Failed to reopen job.");
    } finally {
      setIsReopening(false);
    }
  };

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (!job) {
    return (
      <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Job posting not found.</p>
        <Link to={`${basePath}/jobs`} className="text-[#FF512F] text-sm font-bold mt-2 hover:underline">
          Go back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 min-w-0">
        <button
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate(`${basePath}/jobs`, { replace: true });
            }
          }}
          className="shrink-0 p-2 md:-ml-2 hover:bg-gray-100 rounded-full transition-colors group touch-manipulation mt-1 md:mt-2 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-[#FF512F]" />
        </button>

        <div className="flex-1 min-w-0">
          <PageHeader
            tag="Job Details"
            title={job.title}
            truncateTitle
            actions={
              user?.role !== 'interviewer' && (
                <div className="flex items-center gap-1 sm:gap-2">
                  {job.status === "Closed" ? (
                    <button
                      onClick={handleReopenJob}
                      disabled={isReopening}
                      className="w-fit px-2 sm:px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
                    >
                      {isReopening ? <Spinner className="w-3.5 h-3.5 shrink-0 border-t-2 border-b-2 border-emerald-700" /> : <RotateCcw className="w-3 h-3 shrink-0" />}
                      {isReopening ? "Reopening..." : "Reopen Job"}
                    </button>
                  ) : (
                    <>
                      <Link
                        to={`${basePath}/jobs/${id}/edit`}
                        state={{ from: "details" }}
                        className="w-fit px-2 sm:px-3 py-1.5 border border-gray-200 hover:border-[#FF512F] bg-white text-gray-700 hover:text-[#FF512F] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5 shrink-0" />
                        Edit Job Details
                      </Link>

                      <button
                        onClick={() => handleStatusChange("Closed")}
                        disabled={isClosing}
                        className="w-fit px-2 sm:px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
                      >
                        {isClosing ? <Spinner className="w-3.5 h-3.5 shrink-0 border-t-2 border-b-2 border-red-700" /> : <Archive className="w-3.5 h-3.5 shrink-0" />}
                        {isClosing ? "Closing..." : "Close Job"}
                      </button>
                    </>
                  )}
                </div>
              )
            }
          />
        </div>
      </div>

      <JobSummaryCard job={job} />

      {/* Milestone 3: Job Funnel Metrics */}
      <JobFunnelMetricsCard jobId={id!} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div
          className="min-h-0 w-full flex flex-col gap-4 overflow-hidden order-2 lg:order-1"
          style={
            queuePanelHeight != null ? { height: queuePanelHeight } : undefined
          }
        >
          {/* Empty Queue Banner Card */}
          {job.status === "Active" &&
            (getLiveQueueState(job.queueWindows || []) === "open" || getLiveQueueState(job.queueWindows || []) === "wrapping_up") &&
            activeCandidatesCount === 0 && (
              <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 shadow-sm flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
                <div className="p-2 bg-blue-100/80 rounded-xl text-blue-600 shrink-0 shadow-2xs">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="font-bold text-blue-950 text-sm mb-0.5 tracking-tight">Live Queue Running</h4>
                  <p className="text-xs font-semibold text-blue-800 leading-relaxed">
                    <strong>Live Queue:</strong> Your job listing is live. Qualified candidates who complete screening will automatically appear in the waiting room list below in real time.
                  </p>
                </div>
              </div>
            )}

          <LiveQueueCard
            job={job}
            candidates={candidates}
            liveQueueState={getLiveQueueState(job.queueWindows || [])}
          />
        </div>

        <div
          ref={queueWindowsRef}
          className="min-h-0 w-full flex flex-col self-start bg-white border border-gray-100 rounded-xl p-5 shadow-sm order-1 lg:order-2"
        >
          <QueueWindowScheduler
            jobId={id!}
            job={job}
            initialWindows={job.queueWindows || []}
            persistToApi
            allowLiveControls={isActiveJobStatus(job.status)}
            onWindowsChange={(windows: QueueWindow[]) => setJob(prev => prev ? { ...prev, queueWindows: windows } : null)}
            disabled={job.status === "Closed"}
            showAddButton={user?.role !== 'interviewer'}
            isAdmin={user?.role !== 'interviewer'}
            onJobUpdated={(updatedJob) => setJob(updatedJob)}
          />
        </div>
      </div>

      {/* Milestone 3: Past Applicants */}
      <PastApplicantsSection jobId={id!} />

      <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-5 shadow-sm min-w-0">
        <ScreeningQuestionsManager
          jobId={id!}
          initialQuestions={job.screeningQuestions || []}
          persistToApi
          showDragHandles={job.status !== "Closed" && user?.role !== 'interviewer'}
          onQuestionsChange={(questions: ScreeningQuestion[]) => setJob(prev => prev ? { ...prev, screeningQuestions: questions } : null)}
          disabled={job.status === "Closed" || user?.role === 'interviewer'}
          showAddButton={job.status !== "Closed" && user?.role !== 'interviewer'}
        />
      </div>

      {user?.role !== 'interviewer' && (
        <JobInterviewersManager jobId={id!} />
      )}
    </div>
  );
}

