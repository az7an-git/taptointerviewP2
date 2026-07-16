import {
    CandidateMobileCardSkeleton,
    CandidateTableRowSkeleton,
} from "./queuePanelSkeletons";

export function QueueSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6">
            {[1, 2].map((i) => (
                <div
                    key={i}
                    className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm animate-pulse min-w-0"
                >
                    {/* Header — matches JobQueueCard */}
                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 border border-gray-200 rounded-lg shrink-0" />
                            <div className="space-y-2 flex-1 min-w-0">
                                <div className="h-4 sm:h-5 w-32 sm:w-48 bg-gray-200 rounded" />
                                <div className="h-3 w-40 sm:w-56 bg-gray-100 rounded" />
                            </div>
                        </div>
                        <div className="h-11 sm:h-10 w-full sm:w-36 bg-[#FF512F]/15 rounded-lg shrink-0" />
                    </div>

                    {/* Mobile candidate cards */}
                    <div className="sm:hidden divide-y divide-gray-50">
                        {[1, 2, 3].map((j) => (
                            <CandidateMobileCardSkeleton key={j} />
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block">
                        <div className="border-b border-gray-100 bg-gray-50/30 px-4 sm:px-6 py-3 flex gap-8">
                            <div className="w-6 h-3 bg-gray-200 rounded" />
                            <div className="flex-1 h-3 bg-gray-200 rounded max-w-[80px]" />
                            <div className="w-16 h-3 bg-gray-200 rounded" />
                            <div className="w-16 h-3 bg-gray-200 rounded" />
                        </div>
                        <table className="w-full">
                            <tbody className="divide-y divide-gray-50">
                                {[1, 2, 3].map((j) => (
                                    <CandidateTableRowSkeleton key={j} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
