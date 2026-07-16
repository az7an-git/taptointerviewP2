import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { Spinner } from "@/common/ui/Spinner";
import { OtpInput, OTP_DIGIT_COUNT } from "@/common/ui/OtpInput";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email")?.trim() || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (otp.length !== OTP_DIGIT_COUNT) {
      toast.error(`Please enter the ${OTP_DIGIT_COUNT}-digit verification code.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        otp: parseInt(otp, 10),
        new_password: password,
      });

      if (response.status === "success") {
        toast.success(response.data || "Password reset successfully.");
        navigate("/login");
      } else {
        toast.error(response.data || response.message || "Failed to reset password.");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMsg = error.response?.data?.data || error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      autoComplete="on"
      className="space-y-5 w-full max-w-sm min-w-0 bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20 overflow-hidden"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Set New Password</h2>
        <p className="text-gray-300 text-xs">Enter the code from your email and set a new password.</p>
      </div>

      <div className="min-w-0 w-full">
        <label id="reset-otp-label" className="block text-xs font-medium text-gray-200 mb-2 text-center">
          Verification Code (OTP)
        </label>
        <OtpInput
          id="reset-otp"
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
          aria-label="Verification code"
        />
        <p className="text-[10px] text-gray-500 text-center mt-2">
          Enter the {OTP_DIGIT_COUNT}-digit code sent to your email
        </p>
      </div>

      <div>
        <label htmlFor="reset-password" className="block text-xs font-medium text-gray-200 mb-1">New Password</label>
        <div className="relative mt-1">
          <Input
            id="reset-password"
            name="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 pr-10"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="reset-confirm-password" className="block text-xs font-medium text-gray-200 mb-1">Confirm Password</label>
        <div className="relative mt-1">
          <Input
            id="reset-confirm-password"
            name="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="off"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 pr-10"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || otp.length !== OTP_DIGIT_COUNT}
        className="w-full py-4 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <Spinner className="h-5 w-5 border-t-2 border-b-2 border-white" />
        ) : (
          "Update Password"
        )}
      </Button>

      <div className="text-xs text-center text-gray-300">
        <Link to="/login" className="font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
