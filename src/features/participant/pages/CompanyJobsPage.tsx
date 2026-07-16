import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { jobsApi, JobsPagination } from "@/api/jobsApi";
import { createServerClock } from "@/common/utils/serverClock";
import {
  JobOpportunityCard,
  EmptyOpportunities,
  ParticipantFooter,
  CompanyJobsFilters,
  ParticipantHeader,
} from "../components";
import { resetParticipantApplicationSession } from "@/routes/participantSession";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";

const COMPANY_JOBS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
const COMPANY_JOBS_POLL_MS = 60_000;
// Max lookahead for scheduling threshold timeouts (30 minutes)
const THRESHOLD_LOOKAHEAD_MS = 30 * 60 * 1000;

export default function CompanyJobsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<JobsPagination>({
    page: 1,
    limit: COMPANY_JOBS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevSearchFilter = useRef(searchFilter);
  const companyLoadedRef = useRef(false);
  const serverClockRef = useRef(createServerClock());
  const getServerNowMs = useCallback(() => serverClockRef.current.getNowMs(), []);
  const thresholdTimersRef = useRef<number[]>([]);
  const loadInFlightRef = useRef(false);
  const lastRealtimeSyncRef = useRef(0);
  const lastOverdueSyncRef = useRef(0);

  useEffect(() => {
    setPage(1);
    setEmploymentTypeFilter("");
    setSearchQuery("");
    setSearchFilter("");
    setCompany(null);
    companyLoadedRef.current = false;
    lastRealtimeSyncRef.current = 0;
    lastOverdueSyncRef.current = 0;
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchFilter(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (prevSearchFilter.current !== searchFilter) {
      prevSearchFilter.current = searchFilter;
      setPage(1);
    }
  }, [searchFilter]);

  const loadJobs = useCallback(
    async (silent = false) => {
      if (!slug) return;
      if (silent && loadInFlightRef.current) return;
      if (silent) loadInFlightRef.current = true;

      try {
        if (!silent) {
          setIsLoading(true);
          setError(null);
        }
        const response = await jobsApi.getCompanyJobs(slug, {
          page,
          limit: COMPANY_JOBS_PAGE_SIZE,
          ...(employmentTypeFilter ? { employment_type: employmentTypeFilter } : {}),
          ...(searchFilter ? { search: searchFilter } : {}),
        });
        if (response.status === "success" && response.data) {
          serverClockRef.current.sync(response.serverTimeMs);
          setCompany({
            id: response.data.company.id,
            name: response.data.company.company_name,
            slug: response.data.company.company_slug,
          });
          setJobs(response.data.jobs || []);
          setPagination(response.pagination);
          companyLoadedRef.current = true;
        } else {
          throw new Error("Failed to load company details");
        }
      } catch (err: any) {
        console.error("Failed to load company jobs:", err);
        if (!silent) {
          setError(err.response?.data?.data || "Unable to fetch job opportunities. Please try again.");
          setJobs([]);
          setPagination({ page: 1, limit: COMPANY_JOBS_PAGE_SIZE, total: 0, totalPages: 1 });
        }
      } finally {
        if (silent) loadInFlightRef.current = false;
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [slug, page, employmentTypeFilter, searchFilter]
  );

  useEffect(() => {
    loadJobs(false);
  }, [loadJobs]);

  const shouldPollJobs = useMemo(
    () => jobs.some((job) => job.queue_status === "scheduled" || job.queue_status === "open"),
    [jobs]
  );

  const hasOverdueScheduledJobs = useMemo(() => {
    const nowMs = getServerNowMs();
    return jobs.some((job) => {
      if (job.queue_status !== "scheduled" || !job.next_window?.starts_at) return false;
      const startsMs = new Date(job.next_window.starts_at).getTime();
      return !Number.isNaN(startsMs) && startsMs <= nowMs;
    });
  }, [jobs, getServerNowMs]);

  // One-shot catch-up when API still shows scheduled after window start (throttled)
  useEffect(() => {
    if (!slug || !hasOverdueScheduledJobs) return;
    const now = Date.now();
    if (now - lastOverdueSyncRef.current < 30_000) return;
    lastOverdueSyncRef.current = now;
    void loadJobs(true);
  }, [slug, hasOverdueScheduledJobs, loadJobs]);

  // Background safety-net poll (60s)
  useEffect(() => {
    if (!slug || !shouldPollJobs) return;

    const pollId = window.setInterval(() => {
      loadJobs(true);
    }, COMPANY_JOBS_POLL_MS);

    return () => window.clearInterval(pollId);
  }, [slug, shouldPollJobs, loadJobs]);

  const realtimeHandlers = useMemo(
    () => ({
      queue_status_changed: (payload: unknown) => {
        const { job_id: jobId, queue_status: queueStatus } = (payload ?? {}) as {
          job_id?: string;
          queue_status?: string;
        };
        if (jobId && queueStatus) {
          setJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.id === jobId ? { ...job, queue_status: queueStatus } : job
            )
          );
        }
      },
      queue_windows_updated: () => {
        void loadJobs(true);
      },
    }),
    [loadJobs]
  );

  const handleRealtimeSubscribed = useCallback(() => {
    const now = Date.now();
    if (now - lastRealtimeSyncRef.current < 5_000) return;
    lastRealtimeSyncRef.current = now;
    void loadJobs(true);
  }, [loadJobs]);

  useRealtimeChannel(company?.id ? `company:${company.id}` : null, realtimeHandlers, {
    onSubscribed: handleRealtimeSubscribed,
  });

  // Threshold-based: fire exactly when starts_at or ends_at is reached
  useEffect(() => {
    // Clear any existing threshold timers
    thresholdTimersRef.current.forEach((id) => window.clearTimeout(id));
    thresholdTimersRef.current = [];

    if (!slug || jobs.length === 0) return;

    const nowMs = getServerNowMs();

    jobs.forEach((job) => {
      if (!job.next_window) return;

      const { starts_at, ends_at } = job.next_window;

      // Schedule refetch at starts_at (for scheduled jobs about to open)
      if (starts_at && job.queue_status === "scheduled") {
        const msUntil = new Date(starts_at).getTime() - nowMs;
        if (msUntil > 0 && msUntil < THRESHOLD_LOOKAHEAD_MS) {
          const timerId = window.setTimeout(() => {
            loadJobs(true);
          }, msUntil + 1500); // +1.5s buffer for backend propagation
          thresholdTimersRef.current.push(timerId);
        }
      }

      // Schedule refetch at ends_at (for open jobs about to close)
      if (ends_at && job.queue_status === "open") {
        const msUntil = new Date(ends_at).getTime() - nowMs;
        if (msUntil > 0 && msUntil < THRESHOLD_LOOKAHEAD_MS) {
          const timerId = window.setTimeout(() => {
            loadJobs(true);
          }, msUntil + 1500);
          thresholdTimersRef.current.push(timerId);
        }
      }
    });

    return () => {
      thresholdTimersRef.current.forEach((id) => window.clearTimeout(id));
      thresholdTimersRef.current = [];
    };
  }, [slug, jobs, getServerNowMs, loadJobs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const fallbackName = slug && slug !== ":"
      ? slug.charAt(0).toUpperCase() + slug.slice(1).split("-")[0]
      : "Platform";
    const name = company?.name || fallbackName;
    document.title = `${name} Opportunities | Tap To Interview`;
    return () => {
      document.title = "Tap To Interview";
    };
  }, [company, slug]);

  const companyName = company?.name || (slug && slug !== ":"
    ? slug.charAt(0).toUpperCase() + slug.slice(1).split("-")[0]
    : "Platform");

  const hasActiveFilters = useMemo(
    () => Boolean(employmentTypeFilter || searchFilter),
    [employmentTypeFilter, searchFilter]
  );
  const showPagination = useMemo(() => pagination.totalPages > 1, [pagination.totalPages]);
  const showSkeleton = isLoading && jobs.length === 0 && !companyLoadedRef.current;
  const isRefreshing = isLoading && (jobs.length > 0 || companyLoadedRef.current);

  const handleEmploymentTypeFilterChange = (value: string) => {
    setEmploymentTypeFilter(value);
    setPage(1);
  };

  const handleJoinQueue = (job: any) => {
    resetParticipantApplicationSession();
    localStorage.setItem("selectedJobId", job.id);
    localStorage.setItem("selectedJobTitle", job.title);
    localStorage.setItem("selectedCompanySlug", slug || "");
    localStorage.setItem("selectedCompanyName", companyName);
    navigate(`/company/${slug}/job/${job.id}`);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-white font-sans flex flex-col antialiased overflow-y-auto overflow-x-hidden scrollbar-hide">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF512F] opacity-5 blur-3xl rounded-full pointer-events-none"></div>

      <ParticipantHeader companyName={companyName} />

      <div className="flex-1 p-6 relative z-10 w-full flex flex-col items-center justify-start py-8">
        <div className={`${jobs.length > 4 ? "max-w-6xl" : "max-w-4xl"} w-full space-y-6`}>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-1 bg-[#FF512F] rounded-full"></span>
              <span className="text-[10px] uppercase tracking-widest text-[#FF512F] font-black flex items-center gap-1">
                Waiting Room
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Active Opportunities</h1>
            <p className="text-gray-400 text-xs max-w-2xl mx-auto font-medium leading-relaxed">
              Select an open position below to join the live interview waiting room. Please ensure your camera and microphone are ready.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Something went wrong</h4>
                <p className="text-xs text-red-300 mt-1 font-medium">{error}</p>
              </div>
            </div>
          )}

          {!error && (
            <CompanyJobsFilters
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchInputRef={searchInputRef}
              employmentTypeFilter={employmentTypeFilter}
              onEmploymentTypeFilterChange={handleEmploymentTypeFilterChange}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              totalJobs={pagination.total}
              loadedJobsCount={jobs.length}
            />
          )}

          <div className="w-full">
            {showSkeleton ? (
              <div className="grid grid-cols-1 gap-3.5 max-w-3xl mx-auto w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
                    <div className="space-y-2 flex-1 w-full min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 bg-white/10 rounded-md w-1/3"></div>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                        <div className="h-4 bg-white/5 rounded w-24"></div>
                        <div className="h-4 bg-white/5 rounded w-32"></div>
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 pt-0.5">
                        <div className="h-4 bg-white/5 rounded w-20"></div>
                        <div className="h-4 bg-white/5 rounded w-28"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-white/5 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0 mt-2 sm:mt-0">
                      <div className="w-full sm:w-[116px] h-[36px] bg-white/10 rounded-lg shrink-0"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !error && jobs.length === 0 ? (
              <EmptyOpportunities hasActiveFilters={hasActiveFilters} />
            ) : !error ? (
              <div
                className={`space-y-3.5 transition-opacity duration-200 ${isRefreshing ? "opacity-50 pointer-events-none" : ""}`}
                aria-busy={isRefreshing}
              >
                {jobs.length <= 4 ? (
                  <div className="grid grid-cols-1 gap-3.5 max-w-3xl mx-auto w-full">
                    {jobs.map((job) => (
                      <JobOpportunityCard
                        key={job.id}
                        job={job}
                        onJoinQueue={handleJoinQueue}
                        getServerNowMs={getServerNowMs}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {jobs.map((job) => (
                      <JobOpportunityCard
                        key={job.id}
                        job={job}
                        onJoinQueue={handleJoinQueue}
                        getServerNowMs={getServerNowMs}
                        isGrid={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {showPagination && !showSkeleton && !error && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-md mx-auto w-full">
              <p className="text-xs text-gray-500 font-medium whitespace-nowrap text-center sm:text-left">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="h-9 min-w-0 px-2 sm:px-3 flex items-center justify-center gap-1.5 border border-white/10 rounded-lg text-xs font-bold transition-colors text-white bg-white/5 hover:bg-white/10 hover:border-white/20 disabled:text-gray-600 disabled:bg-white/[0.02] disabled:border-white/5 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isLoading}
                  className="h-9 min-w-0 px-2 sm:px-3 flex items-center justify-center gap-1.5 border border-white/10 rounded-lg text-xs font-bold transition-colors text-white bg-white/5 hover:bg-white/10 hover:border-white/20 disabled:text-gray-600 disabled:bg-white/[0.02] disabled:border-white/5 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ParticipantFooter />
    </div>
  );
}
