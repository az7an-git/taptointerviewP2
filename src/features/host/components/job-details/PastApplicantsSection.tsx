import { useState, useEffect, useCallback } from "react";
import { Users, Star } from "lucide-react";
import { jobsApi } from "@/api/jobsApi";
import { PastApplicantItem } from "@/types/job";
import TablePagination from "@/common/ui/TablePagination";
import PastApplicantDetailModal from "./PastApplicantDetailModal";
import { useIntersectionObserver } from "@/common/hooks/useIntersectionObserver";
import { getStatusColors, getOutcomeColors } from "../../utils/badgeColors";

interface PastApplicantsSectionProps {
    jobId: string;
}

interface CacheEntry {
    applicants: PastApplicantItem[];
    total: number;
}

let globalPastApplicantsCache: Record<string, CacheEntry> = {};

export default function PastApplicantsSection({ jobId }: PastApplicantsSectionProps) {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const cacheKey = `${jobId}_p${page}`;
    const cachedData = globalPastApplicantsCache[cacheKey];

    const [applicants, setApplicants] = useState<PastApplicantItem[]>(cachedData?.applicants || []);
    const [total, setTotal] = useState(cachedData?.total || 0);
    const [isLoading, setIsLoading] = useState(!cachedData);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<PastApplicantItem | null>(null);
    const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true, rootMargin: "200px" });

    const fetchApplicants = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await jobsApi.getPastApplicants(jobId, { page, limit });
            const fetchedApplicants = res.data?.applicants || [];
            const fetchedTotal = res.data?.total || 0;
            setApplicants(fetchedApplicants);
            setTotal(fetchedTotal);
            globalPastApplicantsCache[cacheKey] = {
                applicants: fetchedApplicants,
                total: fetchedTotal,
            };
        } catch (error) {
            console.error("Failed to load past applicants:", error);
        } finally {
            setIsLoading(false);
        }
    }, [jobId, page, limit, cacheKey]);

    useEffect(() => {
        if (isIntersecting) {
            fetchApplicants();
        }
    }, [fetchApplicants, isIntersecting]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setIsLoading(true);
    };

    const getOutcomeLabel = (outcome: string | null) => {
        if (!outcome) return "N/A";
        const o = outcome.toLowerCase();
        if (o === "hired") return "Hired";
        if (o === "follow_up") return "Follow Up";
        if (o === "not_a_fit") return "Not a Fit";
        return outcome.replace(/_/g, " ");
    };

    const renderStars = (rating: number | null | undefined) => {
        if (rating === null || rating === undefined || rating === 0) {
            return <span className="text-gray-400">N/A</span>;
        }
        return (
            <div className="flex items-center gap-0.5" title={`${rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3 h-3 ${star <= rating ? "fill-amber-400 text-amber-500" : "text-gray-400"
                            }`}
                    />
                ))}
            </div>
        );
    };

    const totalPages = Math.ceil(total / limit) || 1;
    const showSkeleton = isLoading && applicants.length === 0;
    const isRefreshing = isLoading && applicants.length > 0;

    return (
        <div ref={ref}>
            <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 sm:space-y-5">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF512F]" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        Past Applicants {showSkeleton ? <span className="inline-block w-8 h-3 bg-gray-200 rounded animate-pulse" /> : `(${total})`}
                    </h3>
                </div>

                {showSkeleton ? (
                    <>
                        {/* Mobile Skeleton */}
                        <div className="sm:hidden space-y-3 animate-pulse select-none">
                            {Array.from({ length: 4 }).map((_, idx) => (
                                <div key={idx} className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <div className="h-4 bg-gray-200 rounded-md w-28" />
                                        <div className="h-5 bg-gray-200 rounded-full w-14" />
                                    </div>
                                    <div className="h-3 bg-gray-200 rounded-md w-40" />
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <div className="h-3 bg-gray-200 rounded-md w-24" />
                                        <div className="h-6 bg-gray-200 rounded-md w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table Skeleton */}
                        <div className="hidden sm:block overflow-x-auto -mx-5 px-5 animate-pulse select-none">
                            <table className="w-full text-left text-xs text-gray-400">
                                <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">Applicant</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Applied Date</th>
                                        <th className="px-4 py-3">Outcome</th>
                                        <th className="px-4 py-3">Rating</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3">
                                                <div className="h-4 bg-gray-200 rounded-md w-32 mb-1.5" />
                                                <div className="h-3 bg-gray-100 rounded-md w-44" />
                                            </td>
                                            <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded-md w-20" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded-md w-20" /></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded-md w-12" /></td>
                                            <td className="px-4 py-3 text-right"><div className="h-6 bg-gray-200 rounded-md w-20 ml-auto" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : applicants.length === 0 ? (
                    <div className="text-center py-10">
                        <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-xs font-medium">No past applicants found for this job.</p>
                    </div>
                ) : (
                    <div
                        className={`transition-opacity duration-200 ${isRefreshing ? "opacity-50 pointer-events-none" : ""}`}
                        aria-busy={isRefreshing}
                    >
                        {/* Mobile Card List View (< sm) */}
                        <div className="sm:hidden space-y-3">
                            {applicants.map((item) => (
                                <div
                                    key={item.queue_entry_id}
                                    onClick={() => {
                                        setSelectedEntryId(item.queue_entry_id);
                                        setSelectedItem(item);
                                    }}
                                    className="p-3.5 bg-gray-50/70 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 rounded-xl space-y-2.5 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-900 text-xs truncate group-hover:text-[#FF512F] transition-colors">
                                                {item.participant?.first_name} {item.participant?.last_name}
                                            </p>
                                            <p className="text-[11px] text-gray-400 font-normal truncate">{item.participant?.email}</p>
                                        </div>
                                        <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusColors(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 text-[11px] text-gray-500 font-medium pt-1">
                                        <span className="shrink-0 flex items-center gap-1.5">
                                            {item.joined_at ? new Date(item.joined_at).toLocaleDateString() : "N/A"}
                                        </span>
                                        {item.outcome && (
                                            <span className={`font-semibold shrink-0 flex items-center gap-1.5 before:content-[''] before:block before:w-1 before:h-1 before:rounded-full before:bg-gray-300 ${getOutcomeColors(item.outcome).split(' ')[0]}`}>
                                                {getOutcomeLabel(item.outcome)}
                                            </span>
                                        )}
                                        {item.rating ? (
                                            <span className="shrink-0 flex items-center gap-1.5 before:content-[''] before:block before:w-1 before:h-1 before:rounded-full before:bg-gray-300">
                                                {renderStars(item.rating)}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100/80 mt-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEntryId(item.queue_entry_id);
                                                setSelectedItem(item);
                                            }}
                                            className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-[#FF512F] border border-orange-200 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View (>= sm) */}
                        <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
                            <div className="min-w-[700px]">
                                <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 align-middle whitespace-nowrap">Applicant</th>
                                            <th className="px-4 py-3 align-middle whitespace-nowrap w-[100px]">Status</th>
                                            <th className="px-4 py-3 align-middle whitespace-nowrap w-[110px]">Applied Date</th>
                                            <th className="px-4 py-3 align-middle whitespace-nowrap w-[100px]">Outcome</th>
                                            <th className="px-4 py-3 align-middle whitespace-nowrap w-[120px]">Rating</th>
                                            <th className="px-4 py-3 align-middle text-right whitespace-nowrap w-[100px]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {applicants.map((item) => (
                                            <tr
                                                key={item.queue_entry_id}
                                                onClick={() => {
                                                    setSelectedEntryId(item.queue_entry_id);
                                                    setSelectedItem(item);
                                                }}
                                                className="hover:bg-orange-50/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-3 align-middle font-semibold text-gray-900 w-auto min-w-[180px]">
                                                    <div className="truncate max-w-[200px] xl:max-w-[300px] group-hover:text-[#FF512F] transition-colors">{item.participant?.first_name} {item.participant?.last_name}</div>
                                                    <div className="text-[11px] font-normal text-gray-400 truncate max-w-[200px] xl:max-w-[300px]">{item.participant?.email}</div>
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColors(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                    {item.joined_at ? new Date(item.joined_at).toLocaleDateString() : "N/A"}
                                                </td>
                                                <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                    {item.outcome ? (
                                                        <span className={`font-semibold ${getOutcomeColors(item.outcome).split(' ')[0]}`}>
                                                            {getOutcomeLabel(item.outcome)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-middle">
                                                    {renderStars(item.rating)}
                                                </td>
                                                <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedEntryId(item.queue_entry_id);
                                                            setSelectedItem(item);
                                                        }}
                                                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF512F] border border-orange-200/80 group-hover:border-[#FF512F]/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {(!showSkeleton && totalPages > 1) && (
                    <TablePagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
            </div>

            <PastApplicantDetailModal
                jobId={jobId}
                queueEntryId={selectedEntryId}
                previewApplicant={selectedItem}
                isOpen={!!selectedEntryId}
                onClose={() => {
                    setSelectedEntryId(null);
                    setSelectedItem(null);
                }}
            />
        </div >
    );
}
