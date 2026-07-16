import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { Spinner } from "@/common/ui/Spinner";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS } from "@/common/utils/timezone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [timezone, setTimezone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTimezoneOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!timezone) {
      newErrors.timezone = "Please select a timezone.";
    }

    if (!firstName.trim()) {
      newErrors.firstName = "Please enter your first name.";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Please enter your last name.";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: company,
        email,
        timezone,
        password,
      });
      await refreshUser();
      toast.success("Account created successfully!");
      navigate("/admin/dashboard");
    } catch (err: any) {
      const errorMsg = err.response?.data?.data || err.response?.data?.message || "Registration failed";
      if (errorMsg.toLowerCase().includes("email")) {
        setErrors({ email: errorMsg });
      } else {
        setErrors({ form: errorMsg });
      }
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
        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
        /* Hide Firefox password-manager UI on the signup email field */
        .signup-email-input::-moz-credentials-fill-button,
        .signup-email-input::-moz-contacts-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        /* Hide browser-native password reveal (keeps only our Lucide toggle) */
        .signup-password-input::-ms-reveal,
        .signup-password-input::-ms-clear {
          display: none !important;
        }
        .signup-password-input::-webkit-credentials-auto-fill-button,
        .signup-password-input::-webkit-strong-password-auto-fill-button {
          display: none !important;
        }
        .signup-password-input::-webkit-textfield-decoration-container,
        .signup-password-input::-webkit-reveal {
          display: none !important;
        }
        .password-mask {
          -webkit-text-security: disc;
          text-security: disc;
        }
      `}</style>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
        <p className="text-gray-300 text-xs">Join us to manage your queue.</p>
      </div>

      <div className="relative">
        <label htmlFor="signup-email" className="block text-xs font-medium text-gray-200 mb-1">Email Address</label>
        <Input
          id="signup-email"
          name="signup-email"
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
          className="signup-email-input bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
          readOnly={isEmailReadOnly}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.email;
                return next;
              });
            }
          }}
          onFocus={() => setIsEmailReadOnly(false)}
          onClick={() => setIsEmailReadOnly(false)}
          onTouchStart={() => setIsEmailReadOnly(false)}
          onBlur={() => {
            if (!email.trim()) {
              setIsEmailReadOnly(true);
              return;
            }
            if (!isValidEmail(email)) {
              setErrors((prev) => ({
                ...prev,
                email: "Please enter a valid email address.",
              }));
            }
          }}
          placeholder="name@company.com"
          required
        />
        {errors.email && (
          <p className="absolute left-0 top-full text-xs text-red-400 font-medium mt-0.5">
            {errors.email}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <label htmlFor="signup-first-name" className="block text-xs font-medium text-gray-200 mb-1">First Name</label>
          <Input
            id="signup-first-name"
            name="given-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.firstName;
                  return next;
                });
              }
            }}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
            placeholder="John"
            required
          />
          {errors.firstName && (
            <p className="absolute left-0 top-full text-xs text-red-400 font-medium mt-0.5">{errors.firstName}</p>
          )}
        </div>
        <div className="relative">
          <label htmlFor="signup-last-name" className="block text-xs font-medium text-gray-200 mb-1">Last Name</label>
          <Input
            id="signup-last-name"
            name="family-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.lastName;
                  return next;
                });
              }
            }}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
            placeholder="Doe"
            required
          />
          {errors.lastName && (
            <p className="absolute left-0 top-full text-xs text-red-400 font-medium mt-0.5">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="signup-company" className="block text-xs font-medium text-gray-200 mb-1">Company Name</label>
        <Input
          id="signup-company"
          name="organization"
          type="text"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
          placeholder="Your Company"
          required
        />
      </div>

      <div className="relative">
        <label className="block text-xs font-medium text-gray-200 mb-1">Timezone</label>
        <div className="relative" ref={dropdownRef}>
          <div
            className="w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white flex items-center justify-between cursor-pointer focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm min-w-0"
            onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
          >
            <span className={`truncate text-left flex-1 pr-2 ${timezone ? "text-white text-xs" : "text-gray-400"}`}>
              {TIMEZONE_OPTIONS.find(tz => tz.value === timezone)?.label || timezone || "Select Timezone"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isTimezoneOpen ? "rotate-180" : ""}`} />
          </div>

          {isTimezoneOpen && (
            <div className="absolute z-20 top-full left-0 w-full mt-1 bg-gray-800 border border-white/10 rounded-md shadow-lg max-h-[200px] overflow-y-auto scrollbar-custom">
              {TIMEZONE_OPTIONS.map((tz) => (
                <div
                  key={tz.value}
                  className="px-3 py-2 text-xs text-white hover:bg-white/10 cursor-pointer transition-colors font-medium"
                  onClick={() => { setTimezone(tz.value); setIsTimezoneOpen(false); }}
                >
                  {tz.label}
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.timezone && (
          <div className="absolute left-0 top-full text-red-500 text-[10px] mt-0.5">
            {errors.timezone}
          </div>
        )}
      </div>

      <div className="relative">
        <label htmlFor="signup-password" className="block text-xs font-medium text-gray-200 mb-1">Password</label>
        <div className="relative mt-1">
          <Input
            id="signup-password"
            name="new-password"
            type="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
            className={`signup-password-input bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 pr-10 ${!showPassword ? "password-mask" : ""}`}
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
        {errors.password && (
          <div className="absolute left-0 top-full text-red-500 text-[10px] mt-0.5">
            {errors.password}
          </div>
        )}
      </div>

      <div className="relative">
        <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-gray-200 mb-1">Confirm Password</label>
        <div className="relative mt-1">
          <Input
            id="signup-confirm-password"
            name="confirm-password"
            type="text"
            autoComplete="off"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ""))}
            className={`signup-password-input bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500 pr-10 ${!showPassword ? "password-mask" : ""}`}
            placeholder="••••••••"
            required
          />
        </div>
        {errors.confirmPassword && (
          <div className="absolute left-0 top-full text-red-500 text-[10px] mt-0.5">
            {errors.confirmPassword}
          </div>
        )}
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
          "Sign Up"
        )}
      </Button>

      <div className="text-xs text-center text-gray-300">
        <span className="text-gray-400">Already have an account? </span>
        <Link to="/login" className="font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer">
          Sign In
        </Link>
      </div>
    </form>
  );
}
