import { useState, useEffect } from "react";
import { X, CreditCard, Check } from "lucide-react";
import { billingApi, StripePlan } from "@/api/billingApi";
import { toast } from "sonner";
import { Spinner } from "@/common/ui/Spinner";
import { useBodyScrollLock } from "@/common/hooks/useBodyScrollLock";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
}

let globalPlansCache: StripePlan[] | null = null;

export default function CreditsModal({ isOpen, onClose, currentCredits }: CreditsModalProps) {
  const [plans, setPlans] = useState<StripePlan[]>(globalPlansCache || []);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(!globalPlansCache);

  useEffect(() => {
    if (isOpen) {
      if (globalPlansCache) {
        setPlans(globalPlansCache);
        const growth = globalPlansCache.find((p) => p.credits === 50) || globalPlansCache[1] || globalPlansCache[0];
        if (growth) {
          setSelectedPriceId(growth.price_id);
        }
        setIsLoadingPlans(false);
      } else {
        setIsLoadingPlans(true);
      }

      billingApi
        .getPlans()
        .then((data) => {
          setPlans(data);
          globalPlansCache = data;
          // Set default selected price (preferably the Growth Pack / 50 credits one)
          const growth = data.find((p) => p.credits === 50) || data[1] || data[0];
          if (growth) {
            setSelectedPriceId(growth.price_id);
          }
        })
        .catch((err) => {
          console.error("Failed to load billing plans:", err);
          if (!globalPlansCache) {
            toast.error("Could not load credit packages.");
          }
        })
        .finally(() => {
          setIsLoadingPlans(false);
        });
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {/* Modal Container */}
      <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl sm:shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Top Up Credits</h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Current Balance: <span className="text-[#FF512F] font-bold">{currentCredits} Credits</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white">
          {isLoadingPlans ? (
            <div className="grid grid-cols-1 landscape:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 sm:p-4 relative flex flex-col justify-between bg-white animate-pulse min-h-[120px] sm:min-h-[148px]">
                  <div>
                    <div className="h-6 sm:h-7 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 w-12 bg-gray-200 rounded mb-2.5"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="h-5 sm:h-6 w-14 bg-gray-200 rounded"></div>
                    <div className="w-4 h-4 rounded-full border border-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 landscape:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4">
              {plans.map((pkg) => {
                const isSelected = selectedPriceId === pkg.price_id;
                const isPopular = pkg.credits === 50 || pkg.name.toLowerCase().includes("growth") || pkg.name.toLowerCase().includes("popular");
                return (
                  <div
                    key={pkg.price_id}
                    onClick={() => setSelectedPriceId(pkg.price_id)}
                    className={`border rounded-xl p-4 relative flex flex-col justify-between transition-all duration-300 cursor-pointer bg-white min-h-[148px] ${isSelected
                      ? "border-[#FF512F] shadow-md scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">{pkg.credits}</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Credits</div>
                      <div className="text-[10px] sm:text-xs text-gray-600 mt-1.5 leading-tight font-medium">{pkg.description || pkg.name}</div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-sm sm:text-base font-bold text-gray-900">${pkg.price_usd}</div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? "bg-[#FF512F] text-white" : "border border-gray-300 text-transparent"}`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-[#F6F9FC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-lg flex items-center justify-center text-[#FF512F]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">Secure Payment</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Payment secured by Stripe. Credits added instantly.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white">
          <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
            By purchasing, you agree to the Terms of Service.
          </div>
          <button
            className={`w-full sm:w-auto bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer ${isRedirecting || isLoadingPlans ? "opacity-80 cursor-not-allowed" : ""}`}
            disabled={isRedirecting || isLoadingPlans}
            onClick={async () => {
              if (!selectedPriceId) return;
              setIsRedirecting(true);
              try {
                const session = await billingApi.createCheckoutSession(selectedPriceId);
                toast.success("Redirecting to Stripe checkout...");
                // Small delay to let the toast display
                setTimeout(() => {
                  window.location.href = session.url;
                }, 800);
              } catch (error: any) {
                console.error("Failed to create checkout session:", error);
                toast.error("Unable to start checkout. Please try again.");
                setIsRedirecting(false);
              }
            }}
          >
            {isRedirecting ? (
              <>
                <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
                <span>Redirecting...</span>
              </>
            ) : (
              <span>Purchase Selected</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
