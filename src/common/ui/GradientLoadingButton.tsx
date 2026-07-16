import { Spinner } from "@/common/ui/Spinner";

interface GradientLoadingButtonProps {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  title?: string;
  className?: string;
}

const baseClassName =
  "relative flex-1 px-4 py-2.5 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-[#FF512F]/20 transition-all shadow-md cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

export function GradientLoadingButton({
  label,
  isLoading = false,
  disabled = false,
  type = "button",
  onClick,
  title,
  className = "",
}: GradientLoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`${baseClassName} ${className}`.trim()}
    >
      <span className={isLoading ? "invisible" : undefined}>{label}</span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
        </span>
      )}
    </button>
  );
}
