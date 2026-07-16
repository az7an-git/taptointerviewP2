export function DealBreakerQueueNote() {
  return (
    <div className="flex items-start gap-2 pt-3 border-t border-gray-200/80">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" aria-hidden />
      <p className="text-xs text-gray-400 leading-relaxed">
        Candidates who select a{" "}
        <strong className="font-semibold text-gray-500">Deal-Breaker</strong> answer are
        automatically disqualified and cannot enter the queue.
      </p>
    </div>
  );
}
