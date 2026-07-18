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
  const digits = React.useMemo(() => {
    const chars = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    return Array.from({ length: OTP_LENGTH }, (_, i) => chars[i] ?? "");
  }, [value]);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const setDigits = (next: string[]) => {
    onChange(next.join("").slice(0, OTP_LENGTH));
  };

  const focusIndex = (index: number) => {
    const el = inputRefs.current[index];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const numeric = raw.replace(/\D/g, "");
    if (!numeric) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    let cursor = index;
    for (const char of numeric) {
      if (cursor >= OTP_LENGTH) break;
      next[cursor] = char;
      cursor += 1;
    }
    setDigits(next);
    focusIndex(Math.min(cursor, OTP_LENGTH - 1));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusIndex(index - 1);
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? "");
    setDigits(next);
    focusIndex(Math.min(pasted.length, OTP_LENGTH) - 1);
  };

  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      className="grid grid-cols-6 gap-1.5 w-full min-w-0"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={
            inputClassName ||
            "w-full min-w-0 h-10 sm:h-11 text-center text-base sm:text-lg font-bold text-white bg-white/5 border border-white/10 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          }
        />
      ))}
    </div>
  );
}

export const OTP_DIGIT_COUNT = OTP_LENGTH;
