import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Save, EyeOff, Eye, Mail, User } from "lucide-react";
import { Spinner } from "@/common/ui/Spinner";
import { authService } from "@/services/authService";
import { toast } from "sonner";

function readNameParam(params: URLSearchParams, key: string): string {
  const raw = params.get(key);
  if (raw == null || raw === "") return "";
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam) {
      toast.error("Invalid invitation link. No token provided.");
      navigate("/login");
      return;
    }

    setToken(tokenParam);
    if (emailParam) {
      try {
        setEmail(decodeURIComponent(emailParam.replace(/\+/g, " ")));
      } catch {
        setEmail(emailParam);
      }
    }

    setFirstName(readNameParam(searchParams, "first_name"));
    setLastName(readNameParam(searchParams, "last_name"));
  }, [searchParams, navigate]);

  const inviteNameComplete = Boolean(firstName.trim() && lastName.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!inviteNameComplete) {
      toast.error("This invitation link is missing name details. Please use the link from your invitation email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.acceptInvite({
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      });

      toast.success("Account created successfully! Please login.");
      navigate("/login");
    } catch (error: any) {
      console.error("Failed to accept invite", error);
      toast.error(error.response?.data?.data || "Failed to accept invite. Please check your token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <span className="w-12 h-1 bg-gradient-to-r from-[#FF512F] to-[#FF7A00] rounded-full"></span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Join the Team</h1>
        <p className="text-sm text-gray-300 font-medium">Complete your profile to accept the invitation.</p>
      </div>

      {!inviteNameComplete && token && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200">
          This invitation link is missing first or last name. Open the invite link from your email so your name is included.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-200 uppercase tracking-wide">Email Address</label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              disabled
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-200 uppercase tracking-wide">First Name</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={firstName}
                readOnly
                disabled
                placeholder="—"
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-200 uppercase tracking-wide">Last Name</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={lastName}
                readOnly
                disabled
                placeholder="—"
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 cursor-not-allowed focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-200 uppercase tracking-wide">Set Password</label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
              placeholder="Enter Password"
              required
              className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !inviteNameComplete}
          className={`w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg transform hover:scale-[1.01] ${isSubmitting || !inviteNameComplete ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isSubmitting ? (
            <Spinner className="h-4 w-4 border-t-2 border-b-2 border-white" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSubmitting ? "Processing..." : "Accept Invitation"}</span>
        </button>
      </form>
    </div>
  );
}
