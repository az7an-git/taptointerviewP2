import React from "react";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { JobFunnelMetrics as MetricsType } from "@/types/job";

interface StatCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ElementType;
    valueColor?: string;
    bgColor?: string;
    iconColor?: string;
}

function StatCard({ title, value, subtext, icon: Icon, valueColor = "text-gray-900", bgColor = "bg-white", iconColor = "text-gray-400" }: StatCardProps) {
    return (
        <div className={`border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md p-3 md:p-4 rounded-xl flex-1 cursor-pointer transform hover:-translate-y-1 transition-all duration-300 min-w-0 ${bgColor}`}>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block truncate">{title}</span>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div
                className={`text-2xl md:text-3xl font-bold truncate ${valueColor}`}
                title={value.toString()}
            >
                {value}
            </div>
            <div className="text-xs mt-1 font-medium text-gray-400 block truncate">{subtext}</div>
        </div>
    );
}

interface JobFunnelMetricsProps {
    metrics?: MetricsType;
    isLoading?: boolean;
}

export function JobFunnelMetrics({ metrics, isLoading = false }: JobFunnelMetricsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse h-28">
                        <div className="h-3 w-1/2 bg-gray-200 rounded-full mb-4"></div>
                        <div className="h-8 w-1/3 bg-gray-200 rounded-full mb-2"></div>
                        <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    const views = metrics?.views ?? 0;
    const qualified = metrics?.qualified ?? 0;
    const disqualified = metrics?.disqualified ?? 0;

    return (
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Job Funnel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                    title="Total Views"
                    value={views}
                    subtext="Unique page visits"
                    icon={Eye}
                    iconColor="text-blue-500"
                />
                <StatCard
                    title="Qualified"
                    value={qualified}
                    subtext="Passed screening"
                    icon={CheckCircle}
                    valueColor="text-emerald-600"
                    iconColor="text-emerald-500"
                />
                <StatCard
                    title="Disqualified"
                    value={disqualified}
                    subtext="Did not meet requirements"
                    icon={XCircle}
                    valueColor="text-red-600"
                    iconColor="text-red-500"
                />
            </div>
        </div>
    );
}
