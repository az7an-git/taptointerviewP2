import React from "react";

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  inputClassName?: string;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  id = "otp",
  "aria-label": ariaLabel = "Verification code",
  inputClassName,
}: OtpInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onChange(numeric);
  };

  const digits = React.useMemo(() => {
    const chars = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    return Array.from({ length: OTP_LENGTH }, (_, i) => chars[i] ?? "");
  }, [value]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" onClick={handleContainerClick}>
      {/* Hidden input that captures focus, paste, and autofill */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={OTP_LENGTH}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {/* Visual boxes */}
      <div
        role="presentation"
        className="grid grid-cols-6 gap-1.5 w-full min-w-0"
      >
        {digits.map((digit, index) => {
          const isCurrentDigitFocused =
            isFocused &&
            !disabled &&
            (value.length === index || (value.length === OTP_LENGTH && index === OTP_LENGTH - 1));
          return (
            <div
              key={index}
              className={`${inputClassName ||
                "w-full min-w-0 h-10 sm:h-11 text-center text-base sm:text-lg font-bold text-white bg-white/5 border border-white/10 rounded-lg shadow-sm transition-all duration-200"
                } flex items-center justify-center ${isCurrentDigitFocused ? "border-orange-500 ring-1 ring-orange-500 bg-white/10" : ""
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {digit}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const OTP_DIGIT_COUNT = OTP_LENGTH;
