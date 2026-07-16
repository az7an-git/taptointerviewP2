import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { Spinner } from "@/common/ui/Spinner";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function LoginForm() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      const success = await refreshUser();
      if (success) {
        toast.success("Logged in successfully!");
        const profile = await authService.getProfile();
        if (profile.user?.role === 'interviewer') {
          navigate("/interviewer/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      } else {
        setErrors({ form: "Logged in, but failed to fetch user profile." });
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrors({ form: err.response?.data?.data || err.response?.data?.message || "Login failed" });
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      autoComplete="off"
      className="space-y-5 w-full max-w-sm bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20"
    >
      <style>{`
        /* Hide Firefox password-manager UI on the login email field */
        .login-email-input::-moz-credentials-fill-button,
        .login-email-input::-moz-contacts-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        /* Hide browser-native password reveal (keeps only our Lucide toggle) */
        .login-password-input::-ms-reveal,
        .login-password-input::-ms-clear {
          display: none !important;
        }
        .login-password-input::-webkit-credentials-auto-fill-button,
        .login-password-input::-webkit-strong-password-auto-fill-button {
          display: none !important;
        }
        .login-password-input::-webkit-textfield-decoration-container,
        .login-password-input::-webkit-reveal {
          display: none !important;
        }
        .password-mask {
          -webkit-text-security: disc;
          text-security: disc;
        }
      `}</style>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
        <p className="text-gray-300 text-xs">Please enter your Credentials.</p>
      </div>

      <div>
        <label htmlFor="login-email" className="block text-xs font-medium text-gray-200 mb-1">Email Address</label>
        <Input
          id="login-email"
          name="login-email"
          type="text"
          inputMode="email"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore
          aria-autocomplete="none"
          className="login-email-input bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
          readOnly={isEmailReadOnly}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setIsEmailReadOnly(false)}
          onClick={() => setIsEmailReadOnly(false)}
          onTouchStart={() => setIsEmailReadOnly(false)}
          onBlur={() => {
            if (!email.trim()) {
              setIsEmailReadOnly(true);
            }
          }}
          placeholder="name@company.com"
          required
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-xs font-medium text-gray-200 mb-1">Password</label>
        <div className="relative mt-1">
          <Input
            id="login-password"
            name="login-password"
            type="text"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
            className={`login-password-input bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 pr-10 ${!showPassword ? "password-mask" : ""}`}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 z-10 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end text-xs">
        <Link to="/forgot-password" className="font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer">
          Forgot password?
        </Link>
      </div>

      <div className="text-red-500 text-[12px] font-medium text-center min-h-[1rem] flex items-center justify-center">
        {errors.form || "\u00a0"}
      </div>

      <Button
        type="submit"
        className="w-full py-4 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner className="h-5 w-5 border-t-2 border-b-2 border-white" />
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="text-xs text-center text-gray-300 mt-4">
        <span className="text-gray-400">Don't have an account? </span>
        <Link to="/signup" className="font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer">
          Sign Up
        </Link>
      </div>
    </form>
  );
}
