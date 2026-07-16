import { AlertCircle, AlertTriangle } from "lucide-react";

interface CreditAlertBannersProps {
  balance: number;
  isInterviewer: boolean;
  onBuyCredits: () => void;
  variant?: "default" | "compact";
}

export function CreditAlertBanners({ balance, isInterviewer, onBuyCredits, variant = "default" }: CreditAlertBannersProps) {
  if (isInterviewer) return null;

  if (balance === 0) {
    if (variant === "compact") {
      return (
        <div className="animate-fade-in bg-[#FFEBEB] border border-[#FFD1D1] rounded-xl p-2 md:p-2.5 px-3 flex items-center gap-3 shadow-sm max-w-md">
          <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-gray-900">No credits remaining</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Purchase more to continue interviews.</p>
          </div>
          <button
            onClick={onBuyCredits}
            className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            Buy Credits
          </button>
        </div>
      );
    }

    return (
      <div className="mb-4 mx-auto max-w-7xl animate-fade-in">
        <div className="bg-[#FFEBEB] border border-[#FFD1D1] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">No credits remaining</p>
              <p className="text-xs text-gray-600 mt-0.5">Purchase more to continue interviews.</p>
            </div>
          </div>
          <button
            onClick={onBuyCredits}
            className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            Buy Credits
          </button>
        </div>
      </div>
    );
  }

  if (balance > 0 && balance <= 5) {
    if (variant === "compact") {
      return (
        <div className="animate-fade-in bg-[#FFF8E6] border border-[#FFE5A3] rounded-xl p-2 md:p-2.5 px-3 flex items-center gap-3 shadow-sm max-w-md">
          <AlertTriangle className="w-5 h-5 text-[#FF9500] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-gray-900">Low credits: {balance} left</p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Purchase more to keep room active.</p>
          </div>
          <button
            onClick={onBuyCredits}
            className="bg-[#FF9500] hover:bg-[#FF9500]/90 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            Buy Credits
          </button>
        </div>
      );
    }

    return (
      <div className="mb-4 mx-auto max-w-7xl animate-fade-in">
        <div className="bg-[#FFF8E6] border border-[#FFE5A3] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF9500] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">You're running low on interview credits</p>
              <p className="text-xs text-gray-600 mt-0.5">{balance} remaining. Purchase more to keep your interview waiting room running.</p>
            </div>
          </div>
          <button
            onClick={onBuyCredits}
            className="bg-[#FF9500] hover:bg-[#FF9500]/90 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            Buy Credits
          </button>
        </div>
      </div>
    );
  }

  return null;
}
