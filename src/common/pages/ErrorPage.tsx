import { useRouteError } from "react-router-dom";
import { MoveLeft, RotateCcw, AlertTriangle } from "lucide-react";

export default function ErrorPage() {
  const error = useRouteError() as any;
  console.error("Route error:", error);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="w-8 h-8 text-[#FF512F]" />
            </div>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-[#FF512F] to-[#FF7A00] bg-clip-text text-transparent tracking-tighter">
            Oops!
          </h1>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-xs font-medium max-w-sm mx-auto">
            {error?.message || "An unexpected error occurred. Please try again or contact support."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] text-white font-bold rounded-lg hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] cursor-pointer text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200 cursor-pointer transform hover:scale-[1.02] text-sm"
          >
            <MoveLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
