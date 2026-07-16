
export default function JobsSkeleton() {
  const JobCardSkeleton = () => (
    <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 animate-pulse select-none">
      {/* Job Info */}
      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0 w-full">
        {/* Icon block */}
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg shrink-0" />
        {/* Title & Metadata */}
        <div className="space-y-2 min-w-0 flex-1">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded-md w-3/4 md:w-1/2" />
          {/* Metadata items */}
          <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 font-medium min-w-0 pt-1">
            <div className="h-3 bg-gray-200 rounded-md w-32" />
            <div className="h-3 bg-gray-200 rounded-md w-16" />
          </div>
        </div>
      </div>

      {/* Stats, Badge & Actions */}
      <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto border-t border-gray-50 pt-4 mt-2 md:border-t-0 md:pt-0 md:mt-0">
        <div className="flex items-center justify-around md:justify-end gap-4 md:gap-8">
          {/* Queue stat */}
          <div className="text-center w-auto md:w-16 space-y-1.5 flex flex-col items-center">
            <div className="h-6 bg-gray-200 rounded-md w-8" />
            <div className="h-3 bg-gray-200 rounded-md w-12" />
          </div>
          {/* Total stat */}
          <div className="text-center w-auto md:w-16 space-y-1.5 flex flex-col items-center">
            <div className="h-6 bg-gray-200 rounded-md w-8" />
            <div className="h-3 bg-gray-200 rounded-md w-12" />
          </div>
          {/* Status badge */}
          <div className="w-auto md:w-24 flex items-center justify-center shrink-0">
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
          {/* Action buttons */}
          <div className="hidden md:flex items-center justify-end gap-2 shrink-0 md:w-24">
            <div className="h-10 w-10 bg-gray-50 rounded-lg" />
            <div className="h-10 w-10 bg-gray-50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  );
}
