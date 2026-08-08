import { useState, useEffect } from "react";
import { Eye, CheckCircle2, XCircle, RotateCw, TrendingUp } from "lucide-react";
import { jobsApi } from "@/api/jobsApi";
import { JobFunnelMetrics } from "@/types/job";
import { Spinner } from "@/common/ui/Spinner";
import { useIntersectionObserver } from "@/common/hooks/useIntersectionObserver";
import { useJobRealtime } from "@/hooks/useJobRealtime";

interface JobFunnelMetricsCardProps {
    jobId: string;
}

let globalMetricsCache: Record<string, JobFunnelMetrics> = {};

export default function JobFunnelMetricsCard({ jobId }: JobFunnelMetricsCardProps) {
    const cachedMetrics = jobId ? globalMetricsCache[jobId] : null;
    const [metrics, setMetrics] = useState<JobFunnelMetrics | null>(cachedMetrics || null);
    const [isLoading, setIsLoading] = useState(!cachedMetrics);
    const [hasFetched, setHasFetched] = useState(Boolean(cachedMetrics));
    const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true, rootMargin: "100px" });

    useJobRealtime(jobId, () => { }, {
        onMetricsUpdate: (payload: any) => {
            if (payload && payload.job_id === jobId) {
                const updatedMetrics = {
                    job_id: payload.job_id,
                    total_views: payload.total_views,
                    total_qualified: payload.total_qualified,
                    total_disqualified: payload.total_disqualified,
                };
                setMetrics(updatedMetrics);
                globalMetricsCache[jobId] = updatedMetrics;
            }
        },
    });

    const fetchMetrics = async () => {
        setIsLoading(true);
        try {
            const res = await jobsApi.getJobMetrics(jobId);
            setMetrics(res.data);
            if (jobId && res.data) {
                globalMetricsCache[jobId] = res.data;
            }
            setHasFetched(true);
        } catch (error) {
            console.error("Failed to load job metrics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (jobId && (isIntersecting || hasFetched)) {
            fetchMetrics();
        }
    }, [jobId, isIntersecting]);

    const metricItems = [
        {
            label: "Views",
            value: metrics?.total_views ?? 0,
            icon: Eye,
            colors: "bg-blue-50/50 border-blue-100/60",
            iconColor: "text-blue-600",
            valueColor: "text-blue-900",
        },
        {
            label: "Qualified",
            value: metrics?.total_qualified ?? 0,
            icon: CheckCircle2,
            colors: "bg-emerald-50/50 border-emerald-100/60",
            iconColor: "text-emerald-600",
            valueColor: "text-emerald-900",
        },
        {
            label: "Disqualified",
            value: metrics?.total_disqualified ?? 0,
            icon: XCircle,
            colors: "bg-rose-50/50 border-rose-100/60",
            iconColor: "text-rose-600",
            valueColor: "text-rose-900",
        },
    ];

    return (
        <div ref={ref} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 min-w-0">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#FF512F]" />
                    Job Funnel Metrics
                </h3>
                <button
                    onClick={fetchMetrics}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Refresh metrics"
                >
                    {isLoading && metrics ? (
                        <Spinner className="w-3.5 h-3.5 border-t-2 border-b-2 border-gray-500" />
                    ) : (
                        <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {metricItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className={`p-3 border rounded-xl text-center min-w-0 ${item.colors}`}>
                            <div className={`flex items-center justify-center gap-1.5 ${item.iconColor} mb-1 min-w-0`}>
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold truncate" title={item.label}>
                                    {item.label}
                                </span>
                            </div>
                            <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${item.valueColor} flex items-center justify-center h-8`}>
                                {isLoading && !metrics ? (
                                    <div className="h-6 w-12 bg-gray-200/80 rounded-md animate-pulse mx-auto" />
                                ) : (
                                    item.value
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
