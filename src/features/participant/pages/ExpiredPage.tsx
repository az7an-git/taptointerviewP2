import { useParams, useNavigate } from "react-router-dom";
import { Clock, RefreshCw, ArrowLeft, Building2 } from "lucide-react";
import { ParticipantHeader, ParticipantFooter } from "../components";

export default function ExpiredPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const companyName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Company";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col justify-between antialiased">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-700 opacity-5 blur-3xl rounded-full"></div>

      <ParticipantHeader companyName={companyName} />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Content */}
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 border border-white/10">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>{companyName}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Session Expired</h2>
              <p className="text-sm text-gray-400 font-medium">You missed your turn or the session has ended.</p>
            </div>

            <p className="text-xs text-gray-600 font-medium px-4 leading-relaxed">
              To ensure a fair process for everyone, sessions expire after a period of inactivity. You can try to re-join the queue or view other open positions.
            </p>

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              <button
                className="w-full bg-gradient-to-r from-[#FF512F] to-[#FF7A00] hover:from-[#E04020] hover:to-[#FF512F] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF512F]/20 hover:shadow-[#FF512F]/40 transform hover:scale-[1.01] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-join Queue</span>
              </button>
              
              <button
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                onClick={() => navigate(`/company/${slug}`)}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>View All Positions</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ParticipantFooter />
    </div>
  );
}
