import { Video } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";

interface StartInterviewButtonProps {
    isLoading: boolean;
    onStart: () => void;
    className?: string;
}

export function StartInterviewButton({
    isLoading,
    onStart,
    className = "",
}: StartInterviewButtonProps) {
    return (
        <button
            onClick={onStart}
            disabled={isLoading}
            className={`bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation whitespace-nowrap ${className}`}
        >
            {isLoading ? (
                <Spinner className="w-3.5 h-3.5 border-2 border-white/30 border-t-white shrink-0" />
            ) : (
                <Video className="w-3.5 h-3.5 shrink-0" />
            )}
            Start Interview
        </button>
    );
}
