import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { Spinner } from "@/common/ui/Spinner";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword({ email });
      if (response.status === "success") {
        toast.success(response.data || "Verification code sent to your email.");
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(response.data || response.message || "Failed to send reset code.");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
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
      className="space-y-5 w-full max-w-sm bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Forgot Password</h2>
        <p className="text-gray-300 text-xs">Enter your email to receive a 6-digit reset code.</p>
      </div>

      <div>
        <label htmlFor="forgot-email" className="block text-xs font-medium text-gray-200 mb-1">Email Address</label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
          placeholder="name@company.com"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <Spinner className="h-5 w-5 border-t-2 border-b-2 border-white" />
        ) : (
          "Send Reset Code"
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
