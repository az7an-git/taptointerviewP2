import { useState, useMemo } from "react";
import { MapPin, Briefcase, DollarSign, FileText, CheckSquare, BarChart3 } from "lucide-react";
import { Job } from "@/types/job";

interface JobSummaryCardProps {
  job: Job;
}

const formatSalary = (value: number) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return value.toString();
};

export default function JobSummaryCard({ job }: JobSummaryCardProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isReqExpanded, setIsReqExpanded] = useState(false);

  const formattedSalary = useMemo(() => {
    return `$${formatSalary(job.salaryMin)} - $${formatSalary(job.salaryMax)}`;
  }, [job.salaryMin, job.salaryMax]);

  const statusBadgeClass = useMemo(() => {
    const s = job.status?.toLowerCase() ?? "";
    if (s === "active") return "bg-green-50 text-green-600 border-green-100";
    if (s === "paused") return "bg-amber-50 text-amber-600 border-amber-100";
    if (s === "closed") return "bg-red-50 text-red-600 border-red-100";
    return "bg-blue-50 text-blue-600 border-blue-100";
  }, [job.status]);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 md:p-6 shadow-sm overflow-hidden min-w-0 space-y-5">
      {/* Top Row: Horizontal Metadata Bar */}
      <div className="flex flex-wrap items-center gap-y-3 gap-x-5 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-[#FF512F] shrink-0" />
          <span className="font-semibold truncate max-w-[180px] sm:max-w-[280px]" title={job.location}>
            {job.location}
          </span>
        </div>
        <div className="w-1.5 h-1.5 bg-gray-200 rounded-full hidden sm:block"></div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Briefcase className="w-4 h-4 text-[#FF512F] shrink-0" />
          <span className="font-semibold uppercase text-xs tracking-wider">{job.type}</span>
        </div>
        <div className="w-1.5 h-1.5 bg-gray-200 rounded-full hidden sm:block"></div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4 text-[#FF512F] shrink-0" />
          <span className="font-semibold">{formattedSalary}</span>
        </div>
        <div className="sm:ml-auto flex items-center gap-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Status:</span>
          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${statusBadgeClass}`}>
            {job.status}
          </span>
        </div>
      </div>

      {/* Bottom Row: Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description & Requirements Section */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 shrink-0">
              <FileText className="w-4 h-4 text-[#FF512F]" />
              Description
            </h3>
            <p className={`text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap ${!isDescExpanded ? "line-clamp-3" : ""}`}>
              {job.description}
            </p>
            {(job.description || "").length > 260 && (
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-[#FF512F] text-xs font-bold hover:underline cursor-pointer focus:outline-none pt-1 block"
              >
                {isDescExpanded ? "Read Less" : "Read More"}
              </button>
            )}
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="space-y-2 pt-5 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 shrink-0">
                <CheckSquare className="w-4 h-4 text-[#FF512F]" />
                Requirements
              </h3>
              <p className={`text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap ${!isReqExpanded ? "line-clamp-3" : ""}`}>
                {job.requirements}
              </p>
              {(job.requirements || "").length > 260 && (
                <button
                  onClick={() => setIsReqExpanded(!isReqExpanded)}
                  className="text-[#FF512F] text-xs font-bold hover:underline cursor-pointer focus:outline-none pt-1 block"
                >
                  {isReqExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="lg:col-span-1 lg:border-l lg:border-gray-100 lg:pl-6 space-y-2.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FF512F]" />
            Queue Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50/80 border border-gray-100/50 hover:border-[#FF512F]/20 rounded-xl text-center transition-all">
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{job.queueCount || 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mt-1">In Queue</div>
            </div>
            <div className="p-3 bg-gray-50/80 border border-gray-100/50 hover:border-[#FF512F]/20 rounded-xl text-center transition-all">
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{job.totalCount || 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mt-1">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
