import { ArrowLeft } from "lucide-react";

export default function JobDetailSkeleton() {
  return (
    <div className="space-y-6 select-none">
      {/* Header Skeleton */}
      <div className="flex items-start gap-3 min-w-0 animate-pulse">
        <div className="shrink-0 p-2 -ml-2 text-gray-300 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </div>

        <div className="flex flex-1 flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-1 min-w-0 w-full sm:w-1/2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-1 bg-gray-200 rounded-full shrink-0"></span>
              <span className="h-3 bg-gray-200 rounded-md w-20" />
            </div>
            <div className="h-8 bg-gray-200 rounded-md w-3/4" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 self-end sm:self-start mt-2 sm:mt-0">
            <div className="h-8 w-24 bg-gray-200 rounded-lg shadow-sm" />
            <div className="h-8 w-24 bg-gray-200 rounded-lg shadow-sm" />
          </div>
        </div>
      </div>

      {/* Combined Job Status, Stats & Description Card Skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden min-w-0 space-y-6 animate-pulse">
        {/* Top Row: Horizontal Metadata Bar Skeleton */}
        <div className="flex flex-wrap items-center gap-y-4 gap-x-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full shrink-0" />
            <div className="h-4 bg-gray-200 rounded-md w-28" />
          </div>
          <div className="w-1.5 h-1.5 bg-gray-100 rounded-full hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full shrink-0" />
            <div className="h-4 bg-gray-200 rounded-md w-20" />
          </div>
          <div className="w-1.5 h-1.5 bg-gray-100 rounded-full hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full shrink-0" />
            <div className="h-4 bg-gray-200 rounded-md w-24" />
          </div>
          <div className="sm:ml-auto flex items-center gap-2.5">
            <div className="h-3 bg-gray-200 rounded-md w-24" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
        </div>

        {/* Bottom Row: Grid Split Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description & Requirements Section */}
          <div className="lg:col-span-2 space-y-6 min-h-[220px]">
            {/* Description */}
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded-md w-24" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-full" />
                <div className="h-4 bg-gray-200 rounded-md w-11/12" />
                <div className="h-4 bg-gray-200 rounded-md w-4/5" />
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <div className="h-3 bg-gray-200 rounded-md w-28" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-full" />
                <div className="h-4 bg-gray-200 rounded-md w-5/6" />
                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="lg:col-span-1 lg:border-l lg:border-gray-100 lg:pl-8 space-y-3">
            <div className="h-3 bg-gray-200 rounded-md w-24" />
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/80 border border-gray-100/50 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <div className="h-8 bg-gray-200 rounded-md w-10" />
                <div className="h-3 bg-gray-200 rounded-md w-12" />
              </div>
              <div className="p-4 bg-gray-50/80 border border-gray-100/50 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <div className="h-8 bg-gray-200 rounded-md w-10" />
                <div className="h-3 bg-gray-200 rounded-md w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Live Queue & Queue Windows Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
        {/* Live Queue Skeleton */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-full min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded-md w-24" />
            <div className="h-5 bg-gray-200 rounded-full w-16" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded-md w-28" />
                    <div className="h-3 bg-gray-200 rounded-md w-20" />
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded-full w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Queue Scheduler Skeleton */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded-md w-36" />
            <div className="h-8 bg-gray-200 rounded-lg w-24" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-32" />
                  <div className="h-3 bg-gray-200 rounded-md w-24" />
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Screening Questions Skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-w-0 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded-md w-44" />
          <div className="h-8 bg-gray-200 rounded-lg w-28" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-200 rounded-md w-1/4" />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
