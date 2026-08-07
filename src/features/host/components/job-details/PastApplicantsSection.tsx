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
                                <div key={item.queue_entry_id} className="p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl space-y-2.5">
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-900 text-xs truncate">
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
                                            <span className={`capitalize font-semibold shrink-0 flex items-center gap-1.5 before:content-[''] before:block before:w-1 before:h-1 before:rounded-full before:bg-gray-300 ${getOutcomeColors(item.outcome).split(' ')[0]}`}>
                                                {item.outcome.replace(/_/g, " ")}
                                            </span>
                                        )}
                                        {item.rating ? (
                                            <span className="flex items-center gap-1 text-amber-500 font-bold shrink-0 before:content-[''] before:block before:w-1 before:h-1 before:rounded-full before:bg-gray-300">
                                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                {item.rating}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100/80 mt-1">
                                        <button
                                            onClick={() => {
                                                setSelectedEntryId(item.queue_entry_id);
                                                setSelectedItem(item);
                                            }}
                                            className="w-full py-2 bg-white hover:bg-[#FF512F] text-gray-700 hover:text-white border border-gray-200 hover:border-[#FF512F] rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-sm"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View (>= sm) */}
                        <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
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
                                    {applicants.map((item) => (
                                        <tr key={item.queue_entry_id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                {item.participant?.first_name} {item.participant?.last_name}
                                                <div className="text-[11px] font-normal text-gray-400">{item.participant?.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColors(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.joined_at ? new Date(item.joined_at).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.outcome ? (
                                                    <span className={`capitalize font-semibold ${getOutcomeColors(item.outcome).split(' ')[0]}`}>
                                                        {item.outcome.replace(/_/g, " ")}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.rating ? (
                                                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                        {item.rating}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEntryId(item.queue_entry_id);
                                                        setSelectedItem(item);
                                                    }}
                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-[#FF512F] text-gray-700 hover:text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer"
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
        </div>
    );
}
