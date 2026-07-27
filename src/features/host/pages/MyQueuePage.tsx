import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Clock } from "lucide-react";

import { jobsApi } from "@/api/jobsApi";
import { Job } from "@/types/job";

import PageHeader from "@/common/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { JobQueueCard, QueueSkeleton } from "../components";
import { JobRealtimeBridge } from "../components/queue/JobRealtimeBridge";
import { blocksAdmitNext, hasActiveSessionFlow } from "../utils/queueEntryStatus";
import { useCompanyQueueRealtime } from "@/hooks/useCompanyQueueRealtime";

const EXPIRE_RETRY_MS = 30_000;
const EXPIRE_RETRY_MAX = 8;

let globalQueueCache: Job[] | null = null;

export default function MyQueuePage() {
    const { jobId } = useParams<{ jobId: string }>();
    const { setCompanyBalance, refreshUser } = useAuth();
    const [jobs, setJobs] = useState<Job[]>(globalQueueCache || []);
    const [isLoading, setIsLoading] = useState(!globalQueueCache);
    const hadCalledRef = useRef(false);
    const expireRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchJobs = useCallback(async () => {
        try {
            const response = await jobsApi.getActiveQueues();
            const activeQueues = response.data;

            // Populate full queueWindows by fetching individual job details
            const jobsWithWindows = await Promise.all(
                activeQueues.map(async (q) => {
                    try {
                        const detailRes = await jobsApi.getJob(q.id);
                        return {
                            ...q,
                            queueWindows: detailRes.data.queueWindows || [],
                        };
                    } catch (e) {
                        return q;
                    }
                })
            );

            setJobs(jobsWithWindows);
            globalQueueCache = jobsWithWindows;
        } catch (error) {
            console.error("Failed to fetch jobs for queue:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshAfterWindowExpired = useCallback(() => {
        if (expireRetryRef.current) {
            clearInterval(expireRetryRef.current);
            expireRetryRef.current = null;
        }

        let attempts = 0;
        void fetchJobs();

        expireRetryRef.current = setInterval(() => {
            attempts += 1;
            void fetchJobs();
            if (attempts >= EXPIRE_RETRY_MAX && expireRetryRef.current) {
                clearInterval(expireRetryRef.current);
                expireRetryRef.current = null;
            }
        }, EXPIRE_RETRY_MS);
    }, [fetchJobs]);

    useCompanyQueueRealtime(fetchJobs);

    useEffect(() => {
        void fetchJobs();
        const interval = setInterval(() => {
            void fetchJobs();
        }, 50_000);
        return () => {
            clearInterval(interval);
            if (expireRetryRef.current) clearInterval(expireRetryRef.current);
        };
    }, [fetchJobs]);

    const needsFastPoll = jobs.some(
        (job) =>
            job.applicants?.some((a) => blocksAdmitNext(a.status)) ||
            hasActiveSessionFlow(job.applicants)
    );

    useEffect(() => {
        if (!needsFastPoll) return;
        const interval = setInterval(() => {
            void fetchJobs();
        }, 30_000);
        return () => clearInterval(interval);
    }, [needsFastPoll, fetchJobs]);

    useEffect(() => {
        const hasCalled = jobs.some((job) =>
            job.applicants?.some((a) => a.status === "called")
        );
        if (hadCalledRef.current && !hasCalled) {
            void refreshUser();
        }
        hadCalledRef.current = hasCalled;

        if (!hasCalled && expireRetryRef.current) {
            clearInterval(expireRetryRef.current);
            expireRetryRef.current = null;
        }
    }, [jobs, refreshUser]);

    const [isAnyAdmitting, setIsAnyAdmitting] = useState(false);

    if (isLoading) {
        return (
            <div className="min-w-0 w-full max-w-full space-y-4 sm:space-y-6 pb-16 sm:pb-20">
                <PageHeader
                    tag="Queue Management"
                    title={<><span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">MY QUEUE</span></>}
                />
                <QueueSkeleton />
            </div>
        );
    }

    const queueJobs = jobs.filter(
        (job) => job.status === "Active" && job.applicants && job.applicants.length > 0
    ).filter((job) => jobId ? job.id === jobId : true);

    return (
        <div className="min-w-0 w-full max-w-full px-0 sm:px-0 space-y-4 sm:space-y-6 pb-16 sm:pb-20">
            {jobs.map((job) => (
                <JobRealtimeBridge key={`rt-${job.id}`} jobId={job.id} onUpdate={fetchJobs} />
            ))}
            <PageHeader
                tag="Queue Management"
                title={<><span className="bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent">MY QUEUE</span></>}
            />

            {queueJobs.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-sm">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Queues</h3>
                    <p className="text-gray-500">You don't have any active jobs with candidates waiting.</p>
                </div>
            ) : (
                queueJobs.map((job) => (
                    <JobQueueCard
                        key={job.id}
                        job={job}
                        onWindowExpired={refreshAfterWindowExpired}
                        onCreditUpdated={setCompanyBalance}
                        onSessionChange={fetchJobs}
                        isAnyAdmitting={isAnyAdmitting}
                        setIsAnyAdmitting={setIsAnyAdmitting}
                    />
                ))
            )}
        </div>
    );
}

