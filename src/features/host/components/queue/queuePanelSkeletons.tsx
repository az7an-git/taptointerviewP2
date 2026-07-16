export function LiveInterviewPanelSkeleton() {
    return (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 mb-1 rounded-xl sm:rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden animate-pulse min-w-0">
            <div className="h-1 bg-red-100" />
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-red-100 bg-red-50/80">
                <div className="h-3 w-32 bg-red-100 rounded" />
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-4 bg-gradient-to-r from-red-50/60 to-white">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-50 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 bg-red-100 rounded" />
                        <div className="h-3 w-full max-w-sm bg-red-50 rounded" />
                    </div>
                </div>
                <div className="h-11 sm:h-10 w-full sm:w-36 sm:self-end bg-red-100 rounded-lg" />
            </div>
        </div>
    );
}

export function PendingOutcomeBannerSkeleton() {
    return (
        <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 mb-1 rounded-xl sm:rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse min-w-0">
            <div className="h-1 bg-gray-100" />
            <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 bg-gray-100 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-full max-w-xs bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="h-11 sm:h-10 w-full sm:w-44 sm:self-end bg-gray-100 rounded-lg" />
            </div>
        </div>
    );
}

export function CandidateMobileCardSkeleton() {
    return (
        <div className="p-4 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-3 w-8 bg-gray-100 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-6 w-20 bg-gray-50 border border-gray-100 rounded-md mt-1" />
                </div>
            </div>
        </div>
    );
}

export function CandidateTableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4">
                <div className="h-4 w-6 bg-gray-100 rounded" />
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4">
                <div className="h-4 w-16 bg-gray-100 rounded" />
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4">
                <div className="h-6 w-20 bg-gray-50 border border-gray-100 rounded-md" />
            </td>
        </tr>
    );
}
