import { useState, useEffect, useCallback, useMemo } from "react";
import { jobsApi } from "@/api/jobsApi";
import { Job } from "@/types/job";
import { useCompanyQueueRealtime } from "./useCompanyQueueRealtime";
import { normalizeWindowStatus, isWindowInLiveSlot } from "@/features/host/utils/queueWindowLive";

export function useGlobalWindowWarning() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchJobs = useCallback(async () => {
        try {
            const response = await jobsApi.getJobs({ status: "active" });
            const activeJobs = response.data || [];

            const jobsWithWindows = await Promise.all(
                activeJobs.map(async (q) => {
                    try {
                        const detailRes = await jobsApi.getJob(q.id);
                        return detailRes.data;
                    } catch (e) {
                        return q;
                    }
                })
            );

            setJobs(jobsWithWindows);
        } catch (e) {
            // ignore
        }
    }, []);

    useCompanyQueueRealtime(fetchJobs);
    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 60000);
        return () => clearInterval(interval);
    }, [fetchJobs]);

    const activeWarning = useMemo(() => {
        for (const job of jobs) {
            const activeWindow = job.queueWindows?.find(
                (w) =>
                    normalizeWindowStatus(w.status) === "Open" ||
                    normalizeWindowStatus(w.status) === "wrapping_up" ||
                    (normalizeWindowStatus(w.status) === "Scheduled" && isWindowInLiveSlot(w, new Date(now)))
            );

            if (activeWindow?.endTime) {
                const msLeft = new Date(activeWindow.endTime).getTime() - now;
                if (msLeft > 0 && msLeft <= 15 * 60 * 1000) {
                    const minutesRemaining = Math.ceil(msLeft / (60 * 1000));
                    return {
                        job,
                        window: activeWindow,
                        minutesRemaining,
                        waitingCount: job.applicants?.filter(a => {
                            const status = a.status?.toLowerCase();
                            return status === "waiting" || status === "joined";
                        }).length || 0
                    };
                }
            }
        }
        return null;
    }, [jobs, now]);

    return { warning: activeWarning, refresh: fetchJobs };
}
