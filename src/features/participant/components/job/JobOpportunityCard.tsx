import { Briefcase, ArrowRight, Clock, MapPin, Building2, PauseCircle } from "lucide-react";
import { ScheduledWindowLabel, ScheduledWindowCountdown } from "../queue/ScheduledWindowBadge";

interface JobOpportunityCardProps {
  job: any;
  onJoinQueue: (job: any) => void;
  getServerNowMs: () => number;
  isGrid?: boolean;
}

export function JobOpportunityCard({ job, onJoinQueue, getServerNowMs, isGrid = false }: JobOpportunityCardProps) {
  const isOpen = job.queue_status === "open";
  const isScheduled = job.queue_status === "scheduled";
  const isPaused = job.queue_status === "paused";

  return (
    <div
      onClick={isOpen ? () => onJoinQueue(job) : undefined}
      className={`group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col transition-all duration-300 transform ${isGrid
        ? "justify-between gap-4"
        : "sm:flex-row sm:items-center justify-between gap-4"
        } ${isOpen
          ? "hover:border-[#FF512F]/40 hover:bg-white/10 hover:shadow-[0_8px_30px_rgba(255,81,47,0.05)] hover:-translate-y-0.5 cursor-pointer"
          : "opacity-50 hover:border-white/10 hover:shadow-none hover:translate-y-0 !cursor-default"
        }`}
    >
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-base text-white truncate max-w-[65%] group-hover:text-[#FF7A00] transition-colors">{job.title}</h3>
          {isOpen ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">
              Open
            </span>
          ) : isScheduled ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">
              Scheduled
            </span>
          ) : isPaused ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
              Paused
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/5 text-gray-500 rounded-full">
              Closed
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-gray-500 font-medium">
          {job.department && (
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              {job.department}
            </span>
          )}
          <span className="flex items-center gap-1 truncate max-w-[180px]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {job.location}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs font-medium pt-0.5">
          <span className="flex items-center gap-1 capitalize text-gray-500">
            <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
            {job.employment_type}
          </span>
          <span className="text-gray-500/30 font-light">•</span>
          {isOpen ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              Queue Open Now
            </span>
          ) : isScheduled && job.next_window ? (
            <ScheduledWindowLabel startsAt={job.next_window.starts_at} />
          ) : isPaused ? (
            <span className="flex items-center gap-1 text-amber-500/80">
              <PauseCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Queue Paused
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-600">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              Queue Closed
            </span>
          )}
        </div>

        {/* Salary Information (only show here if not in grid layout) */}
        {!isGrid && job.salary_range_from && (
          <div className="text-xs font-bold text-gray-400">
            {job.salary_range_to ? (
              <>${Number(job.salary_range_from).toLocaleString()} - ${Number(
                job.salary_range_to
              ).toLocaleString()}</>
            ) : (
              <>From ${Number(job.salary_range_from).toLocaleString()}</>
            )}
          </div>
        )}
      </div>

      {isGrid ? (
        <div className="flex items-center justify-between w-full border-t border-white/10 pt-3.5 mt-3 gap-3">
          {/* Salary Information on Left */}
          <div className="h-10 flex items-center">
            {job.salary_range_from ? (
              <div className="text-xs font-bold text-gray-400">
                {job.salary_range_to ? (
                  <>${Number(job.salary_range_from).toLocaleString()} - ${Number(
                    job.salary_range_to
                  ).toLocaleString()}</>
                ) : (
                  <>From ${Number(job.salary_range_from).toLocaleString()}</>
                )}
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* Action Button/Badge on Right */}
          <div className="shrink-0 h-10 flex items-center">
            {isOpen ? (
              <button
                className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF512F]/10 hover:shadow-[#FF512F]/20 transform hover:scale-[1.02] cursor-pointer group-hover:shadow-[0_4px_15px_rgba(255,81,47,0.3)]"
                onClick={() => onJoinQueue(job)}
              >
                <span>View Job</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : isScheduled && job.next_window ? (
              <ScheduledWindowCountdown
                startsAt={job.next_window.starts_at}
                getServerNowMs={getServerNowMs}
              />
            ) : isPaused ? (
              <span className="text-xs font-bold text-amber-500/70 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <PauseCircle className="w-3.5 h-3.5" />
                Paused
              </span>
            ) : (
              <span className="text-xs font-bold text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                Closed
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 shrink-0">
          {isOpen ? (
            <button
              className="w-full sm:w-auto bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF512F]/10 hover:shadow-[#FF512F]/20 transform hover:scale-[1.02] cursor-pointer group-hover:shadow-[0_4px_15px_rgba(255,81,47,0.3)]"
              onClick={() => onJoinQueue(job)}
            >
              <span>View Job</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : isScheduled && job.next_window ? (
            <ScheduledWindowCountdown
              startsAt={job.next_window.starts_at}
              getServerNowMs={getServerNowMs}
            />
          ) : isPaused ? (
            <span className="w-full sm:w-auto text-xs font-bold text-amber-500/70 bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5">
              <PauseCircle className="w-3.5 h-3.5" />
              Paused
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              Closed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
