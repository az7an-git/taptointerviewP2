import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import PageHeader from "@/common/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Job } from "@/types/job";
import { jobsApi } from "@/api/jobsApi";
import { getPostNewJobHref, POST_JOB_NEW_INTENT } from "../utils/postJobWizardStorage";
import { ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  isDark?: boolean;
  valueColor?: string;
}

function StatCard({ title, value, subtext, isDark = false, valueColor = "" }: StatCardProps) {
  const isLongValue = typeof value === "string" && value.length > 10;
  const textSizeClass = isLongValue ? "text-base md:text-lg" : "text-2xl md:text-3xl";

  return (
    <div className={`
      ${isDark ? "bg-[#111827] text-white hover:bg-[#1a2333]" : "bg-white border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md"} 
      p-2.5 md:p-3 rounded-xl flex-1 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 min-w-0
    `}>
      <span className={`text-xs uppercase tracking-widest text-gray-500 font-bold block truncate`}>{title}</span>
      <div
        className={`${textSizeClass} font-bold mt-1 ${isDark ? "text-white" : (valueColor || "text-gray-900")} truncate`}
        title={value.toString()}
      >
        {value}
      </div>
      <div className={`text-xs mt-0.5 font-medium ${isDark ? "text-slate-400" : "text-gray-400"} block truncate`}>{subtext}</div>
    </div>
  );
}

let cachedJobs: Job[] | null = null;

export function DashboardPage() {
  const { user } = useAuth();
  const basePath = user?.role === 'interviewer' ? '/interviewer' : '/admin';
  // Getting credits from AppLayout context
  const { credits } = useOutletContext<{ credits: number; openCreditsModal: () => void }>();
  const [jobs, setJobs] = useState<Job[]>(cachedJobs || []);
  const [isLoadingJobs, setIsLoadingJobs] = useState(!cachedJobs);

  const activeJobs = jobs.filter(j => j.status?.toLowerCase() === 'active');
  const inQueue = activeJobs.reduce((sum, job) => sum + (job.queueCount || 0), 0);

  const [interviewsToday, setInterviewsToday] = useState<number | null>(null);
  const [passRate, setPassRate] = useState<number | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (user?.company?.company_url) {
      try {
        await navigator.clipboard.writeText(user.company.company_url);
        setCopied(true);
        toast.success("Company portal URL copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link");
      }
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      if (!cachedJobs) setIsLoadingJobs(true);
      try {
        const response = await jobsApi.getJobs();
        setJobs(response.data);
        cachedJobs = response.data;
      } catch (error) {
        console.error("Failed to fetch jobs for dashboard:", error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await jobsApi.getStats();
        if (response.status === "success" && response.data) {
          setInterviewsToday(response.data.interviews_today);
          setPassRate(response.data.pass_rate);
          setTimezone(response.data.timezone);
        }
      } catch (error) {
        console.error("Failed to fetch stats for dashboard:", error);
      }
    };

    fetchJobs();
    fetchStats();
  }, []);

  return (
    <div className="space-y-3 animate-page-fade-in">
      {/* Welcome and Header */}
      <PageHeader
        tag="Welcome Back"
        title={<><span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">TAP TO INTERVIEW</span> DASHBOARD</>}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <StatCard
          title="In Queue Now"
          value={inQueue ?? 0}
          subtext={inQueue ? "Active candidates" : "No candidates waiting"}
          isDark={true}
        />
        <StatCard
          title="Interviews Today"
          value={interviewsToday ?? 0}
          subtext={interviewsToday ? "Interviews completed" : "No interviews today"}
          valueColor="text-sky-500"
        />
        <StatCard
          title="Pass Rate"
          value={passRate ? `${passRate}%` : "0%"}
          subtext={passRate ? "Average qualification rate" : "No data available"}
          valueColor="text-emerald-500"
        />
        {user?.role === 'interviewer' ? (
          <StatCard
            title="Timezone"
            value={timezone || user?.timezone || "UTC"}
            subtext="Your session timezone"
            valueColor="text-indigo-500"
          />
        ) : (
          <StatCard
            title="Credits Left"
            value={credits ?? 0}
            subtext={credits > 0 ? "Available balance" : "Purchase credits to start"}
            valueColor="text-amber-500"
          />
        )}
      </div>

      {user?.role === 'interviewer' && user?.company?.company_url && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 md:p-5 mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs uppercase tracking-widest text-[#FF512F] font-bold block">
                Company URL
              </span>
              <a
                href={user.company.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-900 hover:text-[#FF512F] flex items-center gap-1.5 mt-1 break-all hover:underline"
              >
                {user.company.company_url}
              </a>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors border border-gray-200 cursor-pointer w-1/2 md:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <a
                href={user.company.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF512F] hover:bg-[#E04020] active:bg-[#C03010] text-white text-sm font-bold rounded-lg transition-colors border border-transparent cursor-pointer w-1/2 md:w-auto text-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Active Jobs Summary */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 md:p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-[#FF512F] mt-0.5 tracking-tight">Active Jobs</h3>
          </div>
          <Link to={`${basePath}/jobs`} className="text-sm font-bold text-[#FF512F] hover:text-[#E04020] transition-colors cursor-pointer">
            View All
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {isLoadingJobs ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="py-3 flex items-center justify-between -mx-4 px-4 rounded-lg min-w-0 animate-pulse">
                <div className="min-w-0 flex-1 pr-4">
                  {/* Matches text-sm md:text-base line height */}
                  <div className="h-5 md:h-6 flex items-center">
                    <div className="h-4 bg-gray-200 rounded-full w-1/3 max-w-[200px]"></div>
                  </div>
                  {/* Matches text-xs line height + mt-0.5 */}
                  <div className="h-4 flex items-center mt-0.5">
                    <div className="h-3 bg-gray-100 rounded-full w-1/4 max-w-[150px]"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Matches the badge height */}
                  <div className="h-6 bg-gray-100 rounded-full w-[80px]"></div>
                </div>
              </div>
            ))
          ) : activeJobs.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500 font-medium space-y-2">
              <p>No active job postings.</p>
              <Link
                to={getPostNewJobHref(basePath)}
                state={POST_JOB_NEW_INTENT}
                className="inline-block text-xs text-[#FF512F] font-bold hover:underline"
              >
                Post one now &rarr;
              </Link>
            </div>
          ) : (
            activeJobs.slice(0, 7).map((job) => (
              <Link
                to={`${basePath}/jobs/${job.id}`}
                key={job.id}
                className="py-3 flex items-center justify-between hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors cursor-pointer min-w-0"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="font-bold text-gray-900 text-sm md:text-base truncate">{job.title}</div>
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5 truncate">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-[#FFEBEB] text-[#FF3B30] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>{job.queueCount || 0}</span> WAITING
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
