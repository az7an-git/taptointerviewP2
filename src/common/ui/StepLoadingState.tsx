import { Spinner } from "@/common/ui/Spinner";

interface StepLoadingStateProps {
  message: string;
}

export function StepLoadingState({ message }: StepLoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="w-10 h-10 border-t-2 border-b-2 border-[#FF512F]" />
      <p className="text-gray-500 font-medium text-sm text-center max-w-sm px-4">{message}</p>
    </div>
  );
}
