import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/common/ui/PageHeader";
import { Plus } from "lucide-react";
import TablePagination from "@/common/ui/TablePagination";
import { useAuth } from "@/context/AuthContext";
import { Job, JobStatus } from "@/types/job";

import { jobsApi, JobsPagination } from "@/api/jobsApi";
import { toast } from "sonner";
import { JobsSkeleton } from "../components";
import { JobsSearchFilters, JobsDashboardRow } from "../components";
import { getPostNewJobHref, POST_JOB_NEW_INTENT } from "../utils/postJobWizardStorage";

const JOBS_PAGE_SIZE = 10;

interface JobsCache {
  jobs: Job[];
  pagination: JobsPagination;
  statusFilter: string;
  employmentTypeFilter: string;
  searchFilter: string;
  page: number;
  userId: string;
}

const SEARCH_DEBOUNCE_MS = 400;

let globalJobsCache: JobsCache | null = null;

export default function JobsPage() {
  const { user } = useAuth();
  const basePath = useMemo(() => (user?.role === "interviewer" ? "/interviewer" : "/admin"), [user?.role]);

  const hasCache = globalJobsCache !== null && globalJobsCache.userId === user?.id;

  const [statusFilter, setStatusFilter] = useState(hasCache ? globalJobsCache!.statusFilter : "");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState(
    hasCache ? globalJobsCache!.employmentTypeFilter : ""
  );
  const [searchQuery, setSearchQuery] = useState(hasCache ? globalJobsCache!.searchFilter : "");
  const [searchFilter, setSearchFilter] = useState(hasCache ? globalJobsCache!.searchFilter : "");
  const [page, setPage] = useState(hasCache ? globalJobsCache!.page : 1);
  const [jobs, setJobs] = useState<Job[]>(hasCache ? globalJobsCache!.jobs : []);
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [pagination, setPagination] = useState<JobsPagination>(
    hasCache
      ? globalJobsCache!.pagination
      : {
        page: 1,
        limit: JOBS_PAGE_SIZE,
        total: 0,
        totalPages: 1,
      }
  );

  const isInitialMount = useRef(true);
  const prevSearchFilter = useRef(searchFilter);

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

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        if (!globalJobsCache || !isInitialMount.current) {
          setIsLoading(true);
        }
        const response = await jobsApi.getJobs({
          page,
          limit: JOBS_PAGE_SIZE,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(employmentTypeFilter ? { employment_type: employmentTypeFilter } : {}),
          ...(searchFilter ? { search: searchFilter } : {}),
        });
        setJobs(response.data);
        setPagination(response.pagination);
        globalJobsCache = {
          jobs: response.data,
          pagination: response.pagination,
          statusFilter,
          employmentTypeFilter,
          searchFilter,
          page,
          userId: user?.id || "",
        };
      } catch (error) {
        console.error("Failed to fetch jobs from API:", error);
        setJobs([]);
        setPagination({ page: 1, limit: JOBS_PAGE_SIZE, total: 0, totalPages: 1 });
        toast.error("Failed to load your job postings.");
      } finally {
        setIsLoading(false);
        isInitialMount.current = false;
      }
    };

    fetchJobs();
  }, [page, statusFilter, employmentTypeFilter, searchFilter, user?.id]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleEmploymentTypeFilterChange = (value: string) => {
    setEmploymentTypeFilter(value);
    setPage(1);
  };

  const handleCloseJob = async (id: string) => {
    try {
      await jobsApi.closeJob(id);
      let updatedJobs;
      if (statusFilter && statusFilter !== "closed") {
        updatedJobs = jobs.filter((job) => job.id !== id);
      } else {
        updatedJobs = jobs.map((job) => (job.id === id ? { ...job, status: "Closed" as JobStatus } : job));
      }
      setJobs(updatedJobs);
      if (globalJobsCache) {
        globalJobsCache.jobs = updatedJobs;
      }
      toast.success("Job closed successfully!");
    } catch (error: any) {
      console.error("Failed to close job:", error);
      toast.error("Failed to close job posting.");
    }
  };

  const hasActiveFilters = useMemo(
    () => Boolean(statusFilter || employmentTypeFilter || searchFilter),
    [statusFilter, employmentTypeFilter, searchFilter]
  );
  const showPagination = useMemo(() => pagination.totalPages > 1, [pagination.totalPages]);
  const showSkeleton = isLoading && jobs.length === 0;
  const isRefreshing = isLoading && jobs.length > 0;

  return (
    <div className="space-y-6 pb-4 md:pb-6 animate-page-fade-in">
      {/* Header Section */}
      <PageHeader
        tag="All Job Postings"
        title={<span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">MY JOBS</span>}
        actions={
          user?.role !== 'interviewer' ? (
            <Link
              to={getPostNewJobHref(basePath)}
              state={POST_JOB_NEW_INTENT}
              className="w-fit bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer shadow-md hover:shadow-lg touch-manipulation"
            >
              <Plus className="w-4 h-4" />
              <span>Post Job</span>
            </Link>
          ) : undefined
        }
      />

      <JobsSearchFilters
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        employmentTypeFilter={employmentTypeFilter}
        onEmploymentTypeFilterChange={handleEmploymentTypeFilterChange}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        totalJobs={pagination.total}
        loadedJobsCount={jobs.length}
      />

      <div className="space-y-4">
        {showSkeleton ? (
          <JobsSkeleton />
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center space-y-3">
            <p className="text-gray-500 font-medium">
              {hasActiveFilters ? "No job postings match your filters." : "No job postings found."}
            </p>
            {!hasActiveFilters && (
              <Link
                to={getPostNewJobHref(basePath)}
                state={POST_JOB_NEW_INTENT}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#FF512F] hover:underline"
              >
                Post your first job now &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div
            className={`space-y-4 transition-opacity duration-200 ${isRefreshing ? "opacity-50 pointer-events-none" : ""}`}
            aria-busy={isRefreshing}
          >
            {jobs.map((job) => (
              <JobsDashboardRow
                key={job.id}
                job={job}
                basePath={basePath}
                onCloseJob={handleCloseJob}
              />
            ))}
          </div>
        )}
      </div>

      {showPagination && !showSkeleton && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
