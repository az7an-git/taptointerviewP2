import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Coins,
  FileText,
  Clock,
  PauseCircle,
} from "lucide-react";
import { jobsApi } from "@/api/jobsApi";
import { ParticipantFooter, ParticipantHeader } from "../components";
import { Spinner } from "@/common/ui/Spinner";
import { resetParticipantApplicationSession } from "@/routes/participantSession";
import { useJobRealtime } from "@/hooks/useJobRealtime";

function formatEmploymentType(value?: string) {
  if (!value) return "—";
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

function formatSalary(from?: number | string | null, to?: number | string | null) {
  const min = from != null && from !== "" ? Number(from) : null;
  const max = to != null && to !== "" ? Number(to) : null;
  if (min == null) return null;
  if (max != null && max > min) {
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  }
  return `From $${min.toLocaleString()}`;
}

export default function ParticipantJobDetailPage() {
  const { slug, jobId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<any | null>(null);
  const [companyName, setCompanyName] = useState("");
  const isFetchingRef = useRef(false);

  const loadJobDetails = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    if (!slug || !jobId) {
      setError("Job not found.");
      if (!silent) setIsLoading(false);
      return;
    }

    isFetchingRef.current = true;
    try {
      const response = await jobsApi.getJobDetailsByCompany(slug, jobId);
      if (response.status === "success" && response.data?.job) {
        const loadedJob = response.data.job;
        const name = response.data.company?.company_name || "";
        setJob(loadedJob);
        setCompanyName(name);
        localStorage.setItem("selectedJobId", jobId);
        localStorage.setItem("selectedJobTitle", loadedJob.title || "");
        localStorage.setItem("selectedCompanySlug", slug);
        localStorage.setItem("selectedCompanyName", name);

        if (!silent) {
          const viewRecordedKey = `view_recorded_${jobId}`;
          if (!sessionStorage.getItem(viewRecordedKey)) {
            sessionStorage.setItem(viewRecordedKey, "true");
            void jobsApi.recordJobView(slug, jobId).catch(() => {
              sessionStorage.removeItem(viewRecordedKey);
            });
          }
        }
      } else {
        throw new Error("Failed to load job");
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      if (backendMessage) {
        setError(backendMessage);
      }
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  }, [slug, jobId]);

  useEffect(() => {
    loadJobDetails();
  }, [loadJobDetails]);

  const refreshJob = useCallback(() => {
    void loadJobDetails(true);
  }, [loadJobDetails]);

  useJobRealtime(jobId, refreshJob);

  useEffect(() => {
    if (job?.title) {
      document.title = `${job.title} | ${companyName || "Tap To Interview"}`;
    }
    return () => {
      document.title = "Tap To Interview";
    };
  }, [job?.title, companyName]);

  const isOpen = job?.queue_status === "open";
  const isScheduled = job?.queue_status === "scheduled";
  const isPaused = job?.queue_status === "paused";
  const salary = formatSalary(job?.salary_range_from, job?.salary_range_to);

  const handleApply = () => {
    if (!slug || !jobId || !isOpen) return;
    resetParticipantApplicationSession();
    localStorage.setItem("selectedJobId", jobId);
    localStorage.setItem("selectedCompanySlug", slug);
    navigate(`/company/${slug}/screen`);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none" />

      <ParticipantHeader companyName={companyName || "Company"} />

      <div className="flex-1 p-4 relative z-10 w-full flex flex-col items-center py-6">
        <div className="w-full max-w-3xl space-y-4">
          <button
            type="button"
            onClick={() => navigate(`/company/${slug}`)}
            className="flex items-center gap-1 text-[#FF512F] hover:text-[#FF7A00] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All positions</span>
          </button>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Spinner className="w-8 h-8 border-3 border-[#FF512F] border-t-transparent" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider animate-pulse">
                Loading position...
              </span>
            </div>
          ) : error || !job ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300 text-sm">
              {error || "Job not found."}
            </div>
          ) : (
            <article className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <header className="p-5 sm:p-6 border-b border-white/10 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                    {job.title}
                  </h1>
                  {isOpen ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                      Queue open
                    </span>
                  ) : isScheduled ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                      Scheduled
                    </span>
                  ) : isPaused ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                      Paused
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/5 text-gray-500 rounded-full border border-white/10">
                      Closed
                    </span>
                  )}
                </div>

                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 font-medium">
                  {job.department && (
                    <li className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                      {job.department}
                    </li>
                  )}
                  {job.location && (
                    <li className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                      {job.location}
                    </li>
                  )}
                  {job.employment_type && (
                    <li className="flex items-center gap-1.5 capitalize">
                      <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                      {formatEmploymentType(job.employment_type)}
                    </li>
                  )}
                  {salary && (
                    <li className="flex items-center gap-1.5 text-gray-300">
                      <Coins className="w-4 h-4 text-[#FF512F] shrink-0" />
                      {salary}
                    </li>
                  )}
                </ul>

                {isOpen ? (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Live interview waiting room is open now
                  </p>
                ) : isPaused ? (
                  <p className="flex items-center gap-1.5 text-xs text-amber-500/80 font-medium">
                    <PauseCircle className="w-3.5 h-3.5" />
                    Applications are paused for this role
                  </p>
                ) : null}
              </header>

              <div className="p-5 sm:p-6 space-y-6">
                {job.description ? (
                  <section className="space-y-2">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#FF512F]" />
                      Job description
                    </h2>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {job.description}
                    </p>
                  </section>
                ) : null}

                {job.requirements ? (
                  <section className="space-y-2">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#FF512F]" />
                      Requirements
                    </h2>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {job.requirements}
                    </p>
                  </section>
                ) : null}

                {!job.description && !job.requirements && (
                  <p className="text-sm text-gray-500 italic">No additional details provided for this role.</p>
                )}
              </div>

              <footer className="p-5 sm:p-6 border-t border-white/10 bg-black/20 space-y-3">
                {isOpen ? (
                  <>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Review the role above. When you&apos;re ready, continue to answer a few qualification
                      questions, then enter your contact details to join the interview waiting room.
                    </p>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold px-5 py-3.5 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#FF512F]/10 hover:shadow-[#FF512F]/20 cursor-pointer text-sm"
                    >
                      <span className="text-center leading-snug">Apply for this role</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">
                    This position is not accepting applications right now.
                  </p>
                )}
              </footer>
            </article>
          )}
        </div>
      </div>

      <ParticipantFooter />
    </div>
  );
}
