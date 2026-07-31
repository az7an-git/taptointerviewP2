import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Archive, Edit, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/common/ui/PageHeader";
import { ScreeningQuestionsManager } from "../components/screening-questions";
import { QueueWindowScheduler } from "../components/queue-window-scheduler";
import { JobDetailSkeleton, LiveQueueCard, JobSummaryCard, JobInterviewersManager } from "../components";
import { JobFunnelMetrics } from "../components/job-details/JobFunnelMetrics";
import { PastApplicantsPanel } from "../components/queue/PastApplicantsPanel";
import { Job, QueueWindow, ScreeningQuestion } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { toast } from "sonner";
import { isDraftJob } from "../utils/postJobWizardStorage";
import { getLiveQueueState, isActiveJobStatus } from "../utils/queueWindowLive";
import { blocksAdmitNext, hasActiveSessionFlow } from "../utils/queueEntryStatus";
import { useJobRealtime } from "@/hooks/useJobRealtime";

// Feature flag for Milestone 3 development
const ENABLE_M3 = false;


export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = useMemo(() => user?.role === 'interviewer' ? '/interviewer' : '/admin', [user?.role]);

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await jobsApi.getJob(id);
        setJob(response.data);
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
    try {
      let response;
      if (newStatus === "Closed") {
        response = await jobsApi.closeJob(id!);
      } else if (newStatus === "Active" && job.status === "Closed") {
        // Handle Reopen if M3 is enabled
        if (ENABLE_M3) {
          response = await jobsApi.reopenJob(id!);
        } else {
          response = await jobsApi.updateJob(id!, { status: newStatus });
        }
      } else {
        response = await jobsApi.updateJob(id!, { status: newStatus });
      }
      setJob(response.data);
      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error(`Failed to update status to ${newStatus} on API, updating locally:`, error);
      setJob({ ...job, status: newStatus });
      toast.success(`Job status updated to ${newStatus}`);
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
          onClick={() => navigate(-1)}
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
              job.status !== "Closed" && user?.role !== 'interviewer' ? (
                <div className="flex items-center gap-1 sm:gap-2">
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
                    className="w-fit px-2 sm:px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer touch-manipulation"
                  >
                    <Archive className="w-3.5 h-3.5 shrink-0" />
                    Close Job
                  </button>
                </div>
              ) : ENABLE_M3 && job.status === "Closed" && user?.role !== 'interviewer' ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handleStatusChange("Active")}
                    className="w-fit px-2 sm:px-3 py-1.5 border border-[#FF512F] bg-[#FF512F] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#E04020] transition-colors cursor-pointer touch-manipulation shadow-sm"
                  >
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    Reopen Job
                  </button>
                </div>
              ) : null
            }
          />
        </div>
      </div>

      <JobSummaryCard job={job} />

      {ENABLE_M3 && (
        <JobFunnelMetrics metrics={job.funnelMetrics} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div
          className="min-h-0 w-full flex flex-col overflow-hidden order-2 lg:order-1"
          style={
            queuePanelHeight != null ? { height: queuePanelHeight } : undefined
          }
        >
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

      <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-5 shadow-sm min-w-0">
        <ScreeningQuestionsManager
          jobId={id!}
          initialQuestions={job.screeningQuestions || []}
          persistToApi
          showDragHandles={ENABLE_M3 ? true : false}
          onQuestionsChange={(questions: ScreeningQuestion[]) => setJob(prev => prev ? { ...prev, screeningQuestions: questions } : null)}
          disabled={ENABLE_M3 ? job.status === "Closed" : !isDraftJob(job.status)}
          showAddButton={ENABLE_M3 ? job.status !== "Closed" : false}
        />
      </div>

      {ENABLE_M3 && (
        <PastApplicantsPanel jobId={id!} />
      )}

      {user?.role !== 'interviewer' && (
        <JobInterviewersManager jobId={id!} />
      )}
    </div>
  );
}
