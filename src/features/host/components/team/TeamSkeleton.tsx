interface SkeletonProps {
  count?: number;
}

export function ActiveMembersSkeleton({ count = 5 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 animate-pulse select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
            <div className="space-y-1.5">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-40 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
              <div className="w-20 h-5 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function PendingInvitationsSkeleton({ count = 5 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 animate-pulse select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
            <div className="space-y-1.5">
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-40 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
              <div className="w-20 h-5 bg-gray-200 rounded-full"></div>
            </div>
            <div className="w-7 h-7 bg-gray-200 rounded-lg shrink-0"></div>
          </div>
        </div>
      ))}
    </>
  );
}
