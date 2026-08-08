import { useState, useEffect } from "react";
import { Clock, Lock, Pause, EyeOff } from "lucide-react";
import { Job, JobApplicant, type QueueEntryOutcome } from "@/types/job";
import type { LiveQueueState } from "../../utils/queueWindowLive";
import {
  normalizeQueueStatus,
  queueStatusSortWeight,
} from "../../utils/queueEntryStatus";
import { ApplicantDetailsModal } from "./ApplicantDetailsModal";

interface Candidate {
  id: string;
  name: string;
  status: string;
  joinTime: string;
  avatar: string;
  admissionExpiresAt?: string | null;
  outcome?: QueueEntryOutcome | null;
  raw?: JobApplicant;
}

interface LiveQueueCardProps {
  job: Job;
  candidates: Candidate[];
  liveQueueState?: LiveQueueState;
}

export default function LiveQueueCard({
  job,
  candidates,
  liveQueueState = "inactive",
}: LiveQueueCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplicant | null>(null);

  const hasCalled = candidates.some(
    (c) => normalizeQueueStatus(c.status) === "called" && c.admissionExpiresAt
  );
  useEffect(() => {
    if (!hasCalled) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasCalled]);

  const getRemainingSeconds = (expiresAt: string) =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));

  if (job.status === "Active" && liveQueueState === "paused") {
    return (
      <div className="bg-white border border-amber-100 rounded-xl shadow-sm flex flex-col items-center justify-center text-center h-full min-h-0 min-w-0 p-6 select-none">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm border bg-amber-50 text-amber-500 border-amber-100">
          <Pause className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border bg-amber-50 text-amber-600 border-amber-100">
          Queue Paused
        </span>
        <h4 className="font-bold text-gray-900 text-base mb-1">Waiting room paused</h4>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
          New candidates cannot join. Resume the queue when you are ready to accept more people.
        </p>
      </div>
    );
  }

  if (job.status === "Active" && (liveQueueState === "open" || liveQueueState === "wrapping_up")) {
    const sortedCandidates = [...candidates].sort(
      (a, b) =>
        queueStatusSortWeight(a.status) - queueStatusSortWeight(b.status)
    );

    return (
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {liveQueueState === "wrapping_up" && (
          <div className="mb-4 p-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/40 text-xs text-amber-900 shadow-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
            <div className="p-1.5 rounded-lg bg-amber-100/80 text-amber-700 shrink-0 mt-0.5 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-amber-950 text-xs tracking-tight">Window Wrapping Up</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-200/90 text-amber-900 uppercase tracking-wider shrink-0 whitespace-nowrap shadow-2xs">
                  WRAPPING UP
                </span>
              </div>
              <p className="text-[11px] font-medium text-amber-800/90 leading-snug">
                Closed to new candidates. Waiting candidates remain protected.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3 shrink-0">
          <Clock className="w-4 h-4 text-[#FF512F]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
            Waiting Room {sortedCandidates.length > 0 && `(${sortedCandidates.length})`}
          </h3>
        </div>

        <div className="divide-y divide-gray-50 overflow-y-auto max-h-[520px] pr-1.5 scrollbar-brand [scrollbar-gutter:stable]">
          {sortedCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                Waiting for candidates to join...
              </p>
            </div>
          ) : (
            sortedCandidates.map((candidate) => {
              const status = normalizeQueueStatus(candidate.status);
              return (
                <div
                  key={candidate.id}
                  onClick={() => candidate.raw && setSelectedApplicant(candidate.raw)}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 group min-w-0 transition-all ${candidate.raw ? "cursor-pointer hover:bg-orange-50/50 hover:border-orange-100" : ""}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                      {candidate.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-1.5 min-w-0">
                        <span
                          className="truncate max-w-[180px] group-hover:text-[#FF512F] transition-colors"
                          title={candidate.name}
                        >
                          {candidate.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>Joined {candidate.joinTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      {status === "called" ? (
                        <span
                          className="flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 animate-pulse border-blue-200"
                        >
                          CALLING...
                          {candidate.admissionExpiresAt && (() => {
                            const secs = getRemainingSeconds(candidate.admissionExpiresAt);
                            return (
                              <span className={`inline-flex items-center gap-0.5 tabular-nums ${secs <= 15 ? "text-red-500" : "text-blue-500"}`}>
                                <Clock className="w-2.5 h-2.5" />
                                {secs}s
                              </span>
                            );
                          })()}
                        </span>
                      ) : candidate.raw ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplicant(candidate.raw!);
                          }}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-[#FF512F] border border-orange-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          View
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <ApplicantDetailsModal
          jobId={job.id}
          applicant={selectedApplicant}
          isOpen={!!selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      </div>
    );
  }

  if (job.status === "Active" && liveQueueState === "inactive") {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col items-center justify-center text-center h-full min-h-0 min-w-0 p-6 select-none">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm border bg-blue-50 text-blue-500 border-blue-100">
          <Clock className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border bg-blue-50 text-blue-600 border-blue-100">
          Queue Not Open
        </span>
        <h4 className="font-bold text-gray-900 text-base mb-1">No live window right now</h4>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
          The waiting room opens automatically when a scheduled window starts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col items-center justify-center text-center h-full min-h-0 min-w-0 p-6 select-none">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm border ${job.status === "Closed"
          ? "bg-red-50 text-red-500 border-red-100 animate-pulse"
          : job.status === "Paused"
            ? "bg-amber-50 text-amber-500 border-amber-100"
            : "bg-blue-50 text-blue-500 border-blue-100"
          }`}
      >
        {job.status === "Closed" ? (
          <Lock className="w-6 h-6" />
        ) : job.status === "Paused" ? (
          <Pause className="w-6 h-6" />
        ) : (
          <EyeOff className="w-6 h-6" />
        )}
      </div>

      <span
        className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 border ${job.status === "Closed"
          ? "bg-red-50 text-red-600 border-red-100"
          : job.status === "Paused"
            ? "bg-amber-50 text-amber-600 border-amber-100"
            : "bg-blue-50 text-blue-600 border-blue-100"
          }`}
      >
        Queue {job.status}
      </span>

      <h4 className="font-bold text-gray-900 text-base mb-1">
        {job.status === "Closed"
          ? "Candidate Queue is Closed"
          : job.status === "Paused"
            ? "Candidate Queue is Paused"
            : "Candidate Queue Inactive"}
      </h4>

      <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
        {job.status === "Closed"
          ? "This job posting has been closed. Candidates can no longer view or join the waiting room."
          : job.status === "Paused"
            ? "This job posting is temporarily paused. The waiting room is inactive."
            : "This job is currently in draft. The waiting room will activate once the job posting is published."}
      </p>
    </div>
  );
}
