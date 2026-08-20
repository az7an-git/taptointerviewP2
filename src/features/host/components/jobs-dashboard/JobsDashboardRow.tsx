import { Link } from "react-router-dom";
import { MapPin, Briefcase, DollarSign, Edit, Archive } from "lucide-react";
import { Job } from "@/types/job";
import { getJobDetailHref, isDraftJob } from "@/features/host/utils/postJobWizardStorage";

interface JobsDashboardRowProps {
  job: Job;
  basePath: string;
  onCloseJob: (id: string) => void;
}

const formatSalary = (value: number) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + "k";
  }
  return value.toString();
};

const isClosedJob = (status: string) => status.toLowerCase() === "closed";

const getJobInitials = (title: string) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.trim().slice(0, 2).toUpperCase() || "?";
};

const getStatusBorderClass = (status?: string) => {
  const s = status?.toLowerCase() ?? "";
  if (s === "active") return "border-l-3 border-l-emerald-400";
  if (s === "draft") return "border-l-3 border-l-blue-400";
  if (s === "paused") return "border-l-3 border-l-amber-400";
  if (s === "closed") return "border-l-3 border-l-red-400";
  return "border-l-3 border-l-gray-300";
};

export function JobsDashboardRow({ job, basePath, onCloseJob }: JobsDashboardRowProps) {
  const jobHref = getJobDetailHref(basePath, job);
  const editHref = isDraftJob(job.status) ? jobHref : `${basePath}/jobs/${job.id}/edit`;

  return (
    <div className={`bg-white border border-gray-100 ${getStatusBorderClass(job.status)} rounded-xl p-3 md:p-4 shadow-sm hover:border-gray-200 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 group overflow-hidden`}>
      {/* Job Info */}
      <Link
        to={jobHref}
        className="flex items-start gap-3 md:gap-4 flex-1 min-w-0 cursor-pointer"
      >
        <div className="w-10 h-10 md:w-11 md:h-11 bg-gray-50 rounded-lg flex items-center justify-center text-[#FF512F] font-bold text-sm md:text-base shrink-0 group-hover:bg-[#FFF5F2] transition-colors">
          {getJobInitials(job.title)}
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h3
            className="text-base md:text-lg font-bold text-gray-900 truncate group-hover:text-[#FF512F] transition-colors"
            title={job.title}
          >
            {job.title}
          </h3>
          <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[240px]" title={job.location}>
                {job.location}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{job.type}</span>
            </div>
            {(job.salaryMin > 0 || job.salaryMax > 0) && (
              <div className="flex items-center gap-1 shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  ${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Stats, Badge & Actions */}
      <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto border-t border-gray-50 pt-4 mt-2 md:border-t-0 md:pt-0 md:mt-0">
        <div className="flex items-center justify-around md:justify-end gap-4 md:gap-8">
          <div className="text-center w-auto md:w-16">
            <div className="text-lg md:text-xl font-bold text-gray-900">{job.queueCount || 0}</div>
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Queue</div>
          </div>
          <div className="text-center w-auto md:w-16">
            <div className="text-lg md:text-xl font-bold text-gray-900">{job.totalCount || 0}</div>
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">Total</div>
          </div>
          <div className="w-auto md:w-24 flex items-center justify-center shrink-0">
            <div
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${(() => {
                const s = job.status?.toLowerCase() ?? "";
                if (s === "active") return "bg-green-50 text-green-600 border border-green-100";
                if (s === "paused") return "bg-yellow-50 text-yellow-600 border border-yellow-100";
                if (s === "draft") return "bg-blue-50 text-blue-600 border border-blue-100";
                if (s === "closed") return "bg-red-50 text-red-600 border border-red-100";
                return "bg-gray-50 text-gray-600 border border-gray-100";
              })()}`}
            >
              {job.status}
            </div>
          </div>
          {!isClosedJob(job.status) && basePath !== "/interviewer" ? (
            <div className="hidden md:flex items-center justify-end gap-2 shrink-0 md:w-24">
              <Link
                to={editHref}
                state={isDraftJob(job.status) ? undefined : { from: "list" }}
                className="h-9 w-9 flex items-center justify-center border border-gray-200/80 bg-white hover:bg-orange-50/80 hover:border-orange-300 hover:text-[#FF512F] rounded-lg text-gray-600 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 touch-manipulation"
                title={isDraftJob(job.status) ? "Continue draft" : "Edit Job"}
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseJob(job.id);
                }}
                className="h-9 w-9 flex items-center justify-center border border-gray-200/80 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded-lg text-gray-600 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 touch-manipulation"
                title="Close Job"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center justify-end shrink-0 md:w-24">
              <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full select-none shadow-2xs">
                Read Only
              </span>
            </div>
          )}
        </div>

        {!isClosedJob(job.status) && basePath !== "/interviewer" && (
          <div className="flex md:hidden items-center justify-center gap-4">
            <Link
              to={editHref}
              state={isDraftJob(job.status) ? undefined : { from: "list" }}
              className="h-10 min-w-[88px] px-4 flex items-center justify-center gap-2 border border-gray-200/80 bg-white hover:bg-orange-50/80 hover:border-orange-300 rounded-lg text-gray-700 hover:text-[#FF512F] text-sm font-semibold transition-all cursor-pointer shadow-2xs touch-manipulation"
              title={isDraftJob(job.status) ? "Continue draft" : "Edit Job"}
            >
              <Edit className="w-4 h-4 shrink-0" />
              Edit
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCloseJob(job.id);
              }}
              className="h-10 min-w-[88px] px-4 flex items-center justify-center gap-2 border border-red-200/80 bg-white hover:bg-red-50 hover:border-red-300 rounded-lg text-red-600 text-sm font-semibold transition-all cursor-pointer shadow-2xs touch-manipulation"
              title="Close Job"
            >
              <Archive className="w-4 h-4 shrink-0" />
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
