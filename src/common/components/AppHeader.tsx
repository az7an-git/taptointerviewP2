import { Menu, LogOut, AlertTriangle } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

interface AppHeaderProps {
  onMenuClick: () => void;
  onCreditsClick: () => void;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export default function AppHeader({
  onMenuClick,
  onCreditsClick,
  isLoggingOut,
  onLogout,
}: AppHeaderProps) {
  const { user } = useAuth();
  const companyName = user?.company?.company_name || "Tap To Interview";

  return (
    <div className="h-14 bg-white border-b border-gray-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          className="lg:hidden p-1 text-gray-500 hover:text-gray-900 cursor-pointer shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1 h-5 sm:h-6 bg-gradient-to-b from-[#FF512F] to-[#FF7A00] rounded-full shrink-0"
            aria-hidden
          />
          <span
            className="text-sm font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-[240px] lg:max-w-[360px]"
            title={companyName}
          >
            {companyName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {/* Credits Pill */}
        {(() => {
          const balance = user?.company?.balance ?? 0;
          const isLow = balance > 0 && balance <= 5;
          const isEmpty = balance === 0;
          const isInterviewer = user?.role === "interviewer";

          const pillStyle = isEmpty
            ? "bg-[#FFEBEB] text-[#FF3B30]"
            : isLow
              ? "bg-amber-100 text-amber-600"
              : "bg-[#FFEBEB] text-[#FF3B30]";

          if (isInterviewer) {
            return (
              <div
                className={`${pillStyle} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0`}
              >
                {(isLow || isEmpty) && (
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                )}
                <span>{balance} Credits</span>
              </div>
            );
          }

          const interactivePillStyle = isEmpty
            ? "bg-[#FFEBEB] hover:bg-[#FFD1D1] text-[#FF3B30]"
            : isLow
              ? "bg-amber-100 hover:bg-amber-200 text-amber-600"
              : "bg-[#FFEBEB] hover:bg-[#FFD1D1] text-[#FF3B30]";

          return (
            <button
              onClick={onCreditsClick}
              className={`${interactivePillStyle} transition-colors cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0`}
            >
              {(isLow || isEmpty) && (
                <AlertTriangle className="w-3 h-3 shrink-0" />
              )}
              <span>{balance} Credits</span>
            </button>
          );
        })()}
        <button
          className={`hidden lg:flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer hover:scale-[1.01] ${isLoggingOut ? "text-[#FF512F] cursor-not-allowed" : "text-[#FF3B30] hover:text-[#FF3B30]/70"}`}
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Spinner className="h-4 w-4 border-t-2 border-b-2 border-gray-500" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
