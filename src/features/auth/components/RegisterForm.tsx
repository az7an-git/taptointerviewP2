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
import { PhoneInput } from "@/common/ui/PhoneInput";
import { isValidPhoneNumber } from "@/common/utils/phone";
import { OtpInput } from "@/common/ui/OtpInput";

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
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
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

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isRegistered) {
      const newErrors: { [key: string]: string } = {};
      if (!phone.trim() || !isValidPhoneNumber(phone)) {
        newErrors.phone = "Please enter a valid phone number.";
      }
      if (phone.trim() && !smsConsent) {
        newErrors.smsConsent = "You must agree to receive SMS text message alerts to verify your phone.";
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setIsLoading(true);
      try {
        await authService.requestPhoneOtp(phone.trim(), smsConsent);
        setIsVerifyingPhone(true);
        setResendCooldown(30);
        setAttempts(0);
        setIsLockedOut(false);
        toast.info("Verification code sent to your new number.");
      } catch (err: any) {
        const errorMsg = err.response?.data?.data || err.response?.data?.message || "Failed to update phone number.";
        setErrors({ form: errorMsg });
      } finally {
        setIsLoading(false);
      }
      return;
    }

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

    if (phone.trim() && !isValidPhoneNumber(phone)) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    if (phone.trim() && !smsConsent) {
      newErrors.smsConsent = "You must agree to receive SMS text message alerts to verify your phone.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: company,
        email,
        timezone,
        password,
        mobile_phone: phone.trim() || undefined,
        sms_consent: phone.trim() ? smsConsent : undefined,
      });

      if (response?.data?.phone_verification_required || response?.phone_verification_required) {
        setIsRegistered(true);
        setIsVerifyingPhone(true);
        setResendCooldown(30);
        setAttempts(0);
        setIsLockedOut(false);
        setIsLoading(false);
        toast.info("Phone verification is required to complete registration.");
      } else {
        await refreshUser();
        toast.success("Account created successfully!");
        navigate("/admin/dashboard");
      }
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Please enter a 6-digit code.");
      return;
    }
    setIsLoading(true);
    try {
      await authService.verifyPhoneOtp(otpCode);
      toast.success("Phone verified successfully!");
      await refreshUser();
      navigate("/admin/dashboard");
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setIsLockedOut(true);
        toast.error("Too many failed attempts. Code locked out. Please enter a different number.");
      } else {
        toast.error(`${err.response?.data?.data || err.response?.data?.message || "Invalid code"} (${5 - newAttempts} attempts remaining)`);
      }
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authService.resendPhoneOtp();
      toast.success("Verification code resent!");
      setResendCooldown(30);
    } catch (err: any) {
      toast.error(err.response?.data?.data || err.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhone = (num: string) => {
    if (!num) return "";
    if (num.length > 4) {
      return `••••••${num.slice(-4)}`;
    }
    return num;
  };

  return (
    <form
      onSubmit={isVerifyingPhone ? handleVerifyOtp : handleSubmit}
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

      {isVerifyingPhone ? (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">Verify Mobile</h2>
            <p className="text-gray-300 text-xs">A verification code was sent to {maskPhone(phone)}</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between gap-1.5 text-orange-400 text-xs font-bold">
              <span>Verification Required</span>
              <button
                type="button"
                onClick={() => {
                  setIsVerifyingPhone(false);
                  setOtpCode("");
                  setIsLockedOut(false);
                }}
                className="text-[10px] text-orange-400 hover:text-orange-300 underline font-bold flex-shrink-0 cursor-pointer"
              >
                Change Phone
              </button>
            </div>
            <p className="text-[11px] text-gray-300 leading-normal">
              Enter the 6-digit code. Valid for 10 minutes. 5 verification attempts permitted before lockout.
            </p>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-200 mb-1">6-Digit Verification Code</label>
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              disabled={isLoading || isLockedOut}
              inputClassName="w-full min-w-0 h-10 sm:h-11 text-center text-base sm:text-lg font-bold text-white bg-white/5 border border-white/10 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {attempts > 0 && !isLockedOut && (
              <p className="text-[11px] text-red-400 font-medium mt-1">
                Invalid code ({5 - attempts} attempts remaining)
              </p>
            )}
          </div>

          {isLockedOut && (
            <div className="text-red-400 text-xs font-bold">
              Lockout Active (5 failed attempts).
            </div>
          )}

          <div className="flex items-center justify-end text-xs font-medium">
            {resendCooldown > 0 ? (
              <span className="text-gray-400">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-orange-400 hover:text-orange-300 font-bold cursor-pointer hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>

          <Button
            type="submit"
            className="w-full py-4 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] cursor-pointer flex items-center justify-center"
            disabled={isLoading || otpCode.length !== 6}
          >
            {isLoading ? (
              <Spinner className="h-5 w-5 border-t-2 border-b-2 border-white" />
            ) : (
              "Verify Code"
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
            <p className="text-gray-300 text-xs">Join us to manage your queue.</p>
          </div>

          <div className="relative">
            <label htmlFor="signup-email" className="block text-xs font-medium text-gray-200 mb-1">Email Address <span className="text-[#FF512F] font-bold">*</span></label>
            <Input
              id="signup-email"
              name="signup-email"
              type="text"
              inputMode="email"
              disabled={isRegistered}
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
              <label htmlFor="signup-first-name" className="block text-xs font-medium text-gray-200 mb-1">First Name <span className="text-[#FF512F] font-bold">*</span></label>
              <Input
                id="signup-first-name"
                name="given-name"
                type="text"
                autoComplete="given-name"
                disabled={isLoading || isRegistered}
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
              <label htmlFor="signup-last-name" className="block text-xs font-medium text-gray-200 mb-1">Last Name <span className="text-[#FF512F] font-bold">*</span></label>
              <Input
                id="signup-last-name"
                name="family-name"
                type="text"
                autoComplete="family-name"
                disabled={isLoading || isRegistered}
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
            <label htmlFor="signup-company" className="block text-xs font-medium text-gray-200 mb-1">Company Name <span className="text-[#FF512F] font-bold">*</span></label>
            <Input
              id="signup-company"
              name="organization"
              type="text"
              autoComplete="organization"
              disabled={isLoading || isRegistered}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus-visible:border-orange-500 focus-visible:ring-1 focus-visible:ring-orange-500"
              placeholder="Your Company"
              required
            />
          </div>

          <div className="relative">
            <label htmlFor="signup-phone" className="block text-xs font-medium text-gray-200 mb-1">Mobile Phone Number <span className="text-xs text-gray-400">(Optional)</span></label>
            <PhoneInput
              id="signup-phone"
              disabled={isLoading}
              value={phone}
              onChange={(val) => {
                setPhone(val);
                if (errors.phone) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
              className="bg-white/5 border-white/10 text-white focus-within:border-orange-500 rounded-md"
            />
            {errors.phone && (
              <p className="absolute left-0 top-full text-xs text-red-400 font-medium mt-0.5">{errors.phone}</p>
            )}
          </div>

          {phone && (
            <div className="relative py-1">
              <div className="flex items-start gap-2">
                <input
                  id="signup-sms-consent"
                  type="checkbox"
                  disabled={isLoading}
                  checked={smsConsent}
                  onChange={(e) => {
                    setSmsConsent(e.target.checked);
                    if (errors.smsConsent) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.smsConsent;
                        return next;
                      });
                    }
                  }}
                  className="mt-0.5 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="signup-sms-consent" className="text-[11px] text-gray-300 leading-relaxed cursor-pointer select-none">
                  I agree to receive SMS text message alerts <span className="text-[#FF512F] font-bold">*</span>
                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">Message and data rates may apply. Reply STOP to opt out.</div>
                </label>
              </div>
              {errors.smsConsent && (
                <p className="text-[11px] text-red-400 font-medium mt-1">
                  {errors.smsConsent}
                </p>
              )}
            </div>
          )}

          <div className="relative">
            <label className="block text-xs font-medium text-gray-200 mb-1">Timezone <span className="text-[#FF512F] font-bold">*</span></label>
            <div className="relative" ref={dropdownRef}>
              <div
                className={`w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white flex items-center justify-between cursor-pointer focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm min-w-0 ${isRegistered ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !isRegistered && setIsTimezoneOpen(!isTimezoneOpen)}
              >
                <span className={`truncate text-left flex-1 pr-2 ${timezone ? "text-white text-xs" : "text-gray-400"}`}>
                  {TIMEZONE_OPTIONS.find(tz => tz.value === timezone)?.label || timezone || "Select Timezone"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isTimezoneOpen ? "rotate-180" : ""}`} />
              </div>

              {isTimezoneOpen && !isRegistered && (
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
            <label htmlFor="signup-password" className="block text-xs font-medium text-gray-200 mb-1">Password <span className="text-[#FF512F] font-bold">*</span></label>
            <div className="relative mt-1">
              <Input
                id="signup-password"
                name="new-password"
                type="text"
                autoComplete="new-password"
                disabled={isLoading || isRegistered}
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
            <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-gray-200 mb-1">Confirm Password <span className="text-[#FF512F] font-bold">*</span></label>
            <div className="relative mt-1">
              <Input
                id="signup-confirm-password"
                name="confirm-password"
                type="text"
                autoComplete="off"
                disabled={isLoading || isRegistered}
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
        </>
      )}
    </form>
  );
}
