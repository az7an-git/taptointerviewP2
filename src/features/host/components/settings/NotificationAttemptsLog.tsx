import { useState, useEffect, useCallback } from "react";
import { authService } from "@/services/authService";
import { Spinner } from "@/common/ui/Spinner";
import {
    Mail,
    MessageSquare,
    CheckCircle2,
    XCircle,
    MinusCircle,
    ChevronLeft,
    ChevronRight,
    Activity,
    RefreshCw,
} from "lucide-react";

interface NotificationAttempt {
    id: string;
    user_id: string;
    job_id: string;
    queue_entry_id: string;
    notification_type: string;
    channel: "email" | "sms";
    recipient: string;
    status: "sent" | "failed" | "skipped";
    provider_message_id: string | null;
    error_message: string | null;
    attempted_at: string;
}

interface PaginationMeta {
    current_page: number;
    limit: number;
    total_pages: number;
    total_items: number;
}

const STATUS_CONFIG = {
    sent: {
        icon: CheckCircle2,
        label: "Sent",
        className: "text-emerald-600 bg-emerald-50 border-emerald-100",
        iconClass: "text-emerald-500",
    },
    failed: {
        icon: XCircle,
        label: "Failed",
        className: "text-red-600 bg-red-50 border-red-100",
        iconClass: "text-red-500",
    },
    skipped: {
        icon: MinusCircle,
        label: "Skipped",
        className: "text-gray-500 bg-gray-50 border-gray-100",
        iconClass: "text-gray-400",
    },
};

const CHANNEL_CONFIG = {
    email: { icon: Mail, label: "Email" },
    sms: { icon: MessageSquare, label: "SMS" },
};

function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNotificationType(type: string): string {
    return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function NotificationAttemptsLog() {
    const [attempts, setAttempts] = useState<NotificationAttempt[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const LIMIT = 10;

    const fetchAttempts = useCallback(
        async (pageNum: number, silent = false) => {
            if (!silent) setIsLoading(true);
            else setIsRefreshing(true);
            try {
                const data = await authService.getNotificationAttempts(pageNum, LIMIT);
                setAttempts(data.attempts || []);
                setPagination(data.pagination || null);
            } catch (err) {
                console.error("Failed to load notification attempts", err);
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchAttempts(page);
    }, [page, fetchAttempts]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleRefresh = () => {
        fetchAttempts(page, true);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Activity className="w-4 h-4 text-[#FF512F] flex-shrink-0" />
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide whitespace-nowrap">
                        Delivery Log
                    </h4>
                    {pagination && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {pagination.total_items}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    title="Refresh"
                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#FF512F] hover:bg-[#FF512F]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    <RefreshCw
                        className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Spinner className="h-5 w-5 border-[#FF512F]" />
                </div>
            ) : attempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <Activity className="w-8 h-8 text-gray-200" />
                    <p className="text-xs font-bold text-gray-400">No delivery records yet</p>
                    <p className="text-[11px] text-gray-400 leading-normal max-w-[220px]">
                        Records will appear here once candidates join your waiting rooms.
                    </p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {attempts.map((attempt) => {
                        const statusCfg = STATUS_CONFIG[attempt.status] ?? STATUS_CONFIG.failed;
                        const channelCfg =
                            CHANNEL_CONFIG[attempt.channel] ?? CHANNEL_CONFIG.email;
                        const StatusIcon = statusCfg.icon;
                        const ChannelIcon = channelCfg.icon;

                        return (
                            <div
                                key={attempt.id}
                                className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                            >
                                {/* Status icon */}
                                <StatusIcon
                                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${statusCfg.iconClass}`}
                                />

                                {/* Main content */}
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-gray-800">
                                            {formatNotificationType(attempt.notification_type)}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${statusCfg.className}`}
                                        >
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <ChannelIcon className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{attempt.recipient}</span>
                                    </div>

                                    {attempt.error_message && (
                                        <p className="text-[10px] text-red-500 font-medium leading-tight truncate">
                                            {attempt.error_message}
                                        </p>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 mt-0.5">
                                    {formatRelativeTime(attempt.attempted_at)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400 font-medium">
                        Page {pagination.current_page} of {pagination.total_pages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1 || isLoading}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= pagination.total_pages || isLoading}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
