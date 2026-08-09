import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Check, X, CreditCard, ArrowRight, AlertCircle } from "lucide-react";
import { billingApi, PaymentStatusResponse } from "@/api/billingApi";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/common/ui/Spinner";

export default function PaymentStatusPage() {
  const { refreshUser } = useAuth();
  const { status } = useParams<{ status: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statusData?.status === "success") {
      refreshUser().catch((err) => console.error("Failed to refresh user:", err));
    }
  }, [statusData?.status, refreshUser]);

  useEffect(() => {
    if (!sessionId) {
      if (status === "success" || status === "failed") {
        setStatusData({
          status: status === "success" ? "success" : "failed",
          credits: 0,
          amount: 0,
          transactionId: "",
        });
      } else {
        setError("Invalid payment status path parameter.");
      }
      setLoading(false);
      return;
    }

    let isMounted = true;
    billingApi
      .getPaymentStatus(sessionId)
      .then((data: PaymentStatusResponse) => {
        if (isMounted) {
          setStatusData(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error("Error fetching payment status:", err);
          setError("Failed to verify payment status with server.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId, status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F2] to-[#FFEBE6] flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md border border-white/40 max-w-md w-full rounded-2xl p-8 shadow-xl text-center space-y-4 animate-pulse">
          <div className="flex justify-center">
            <Spinner className="w-12 h-12 border-t-2 border-b-2 border-[#FF512F]" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Verifying Payment</h2>
          <p className="text-sm text-gray-500 font-medium">
            Please wait while we confirm your Stripe checkout session status...
          </p>
        </div>
      </div>
    );
  }

  if (error || !statusData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F2] to-[#FFEBE6] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-2xl border border-red-100 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Status Unknown</h2>
            <p className="text-sm text-gray-500 font-medium">
              {error || "We couldn't retrieve the details of your payment session."}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/credits")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Back to Credits & Billing</span>
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = statusData.status === "success";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F2] to-[#FFEBE6] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-xl border border-gray-200 text-center relative overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4 duration-500">

        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF512F] to-[#FF7A00]" />

        {isSuccess ? (
          <div className="space-y-6 pt-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100">
              <Check className="w-8 h-8 stroke-[2px]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                Payment Successful
              </h2>
              <p className="text-sm text-gray-500 px-4">
                Thank you for your purchase. Your account has been credited instantly.
              </p>
            </div>

            {statusData.transactionId ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Credits Purchased</span>
                  <span className="text-base font-bold text-gray-900">{statusData.credits}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Amount Paid</span>
                    <span className="font-medium text-gray-900">${statusData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Method</span>
                    <span className="flex items-center gap-1 font-medium text-gray-900">
                      <CreditCard className="w-4 h-4 text-gray-400" /> Stripe
                    </span>
                  </div>
                  <div className="pt-2 text-xs text-gray-400 break-all font-mono">
                    ID: {statusData.transactionId}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-sm text-gray-500">
                Your credits balance has been updated. You can check your new balance on the dashboard.
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-medium py-2.5 rounded-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/admin/credits")}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
              >
                View Transaction History
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-100">
              <X className="w-8 h-8 stroke-[2px]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                Payment Cancelled
              </h2>
              <p className="text-sm text-gray-500 px-4">
                The transaction was declined or cancelled. No charges were made to your card.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => navigate("/admin/credits")}
                className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-medium py-2.5 rounded-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Try Purchasing Again</span>
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-2.5 rounded-lg transition-colors cursor-pointer text-sm"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
