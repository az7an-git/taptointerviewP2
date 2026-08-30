import { useEffect, useMemo, useState } from "react";
import type { Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import { getCountries } from "react-phone-number-input";
import {
  AsYouType,
  formatIncompletePhoneNumber,
  getCountryCallingCode,
  parseIncompletePhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { PhoneCountrySelect } from "./PhoneCountrySelect";
import "./phone-input.css";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  defaultCountry?: Country;
  disabled?: boolean;
  id?: string;
};

type CountryFlagProps = {
  country?: Country;
  label?: string;
};

function CountryFlag({ country, label }: CountryFlagProps) {
  if (!country) return null;
  const Flag = flags[country];
  if (!Flag) return null;
  return (
    <span className="PhoneInputCountryIcon PhoneInputCountryIcon--border">
      <Flag title={label ?? country} />
    </span>
  );
}

function getNationalDigits(e164: string, country: CountryCode): string {
  if (!e164) return "";

  const parsed = parsePhoneNumberFromString(e164);
  if (parsed?.country === country) {
    return parsed.nationalNumber;
  }

  const callingCode = getCountryCallingCode(country);
  const prefix = `+${callingCode}`;
  if (e164.startsWith(prefix)) {
    return e164.slice(prefix.length).replace(/\D/g, "");
  }

  return "";
}

function toE164(nationalDigits: string, country: CountryCode): string {
  if (!nationalDigits) return "";
  return `+${getCountryCallingCode(country)}${nationalDigits}`;
}

export function PhoneInput({
  value,
  onChange,
  className,
  defaultCountry = "US",
  disabled,
  id,
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(defaultCountry);

  useEffect(() => {
    setCountry(defaultCountry);
  }, [defaultCountry]);

  // Sync country selector if external `value` prop is an E.164 number (e.g. loading saved profile number)
  useEffect(() => {
    if (value && value.startsWith("+")) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed?.country && parsed.country !== country) {
        setCountry(parsed.country as Country);
      }
    }
  }, [value, country]);

  const countryOptions = useMemo(
    () =>
      getCountries().map((code) => ({
        value: code,
        label: en[code] ?? code,
      })),
    []
  );

  const callingCode = getCountryCallingCode(country as CountryCode);
  const nationalDigits = getNationalDigits(value, country as CountryCode);
  const displayValue = nationalDigits
    ? formatIncompletePhoneNumber(nationalDigits, country as CountryCode)
    : "";

  const handleCountryChange = (nextCountry?: Country) => {
    if (!nextCountry || nextCountry === country) return;
    setCountry(nextCountry);
    onChange("");
  };

  const MAX_NATIONAL_LENGTHS: Record<string, number> = {
    US: 10, // USA
    CA: 10, // Canada
    PK: 10, // Pakistan
    IN: 10, // India
    GB: 10, // United Kingdom
    AU: 9,  // Australia
    NZ: 9,  // New Zealand
    AE: 9,  // UAE
    SA: 9,  // Saudi Arabia
    DE: 11, // Germany
    FR: 9,  // France
    CN: 11, // China
    BR: 11, // Brazil
    MX: 10, // Mexico
    ID: 12, // Indonesia
    PH: 10, // Philippines
    MY: 10, // Malaysia
    SG: 8,  // Singapore
    BD: 10, // Bangladesh
    LK: 9,  // Sri Lanka
    NP: 10, // Nepal
    ZA: 9,  // South Africa
    EG: 10, // Egypt
    NG: 10, // Nigeria
    GH: 9,  // Ghana
    KE: 9,  // Kenya
  };

  const handleNationalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    if (!rawValue) {
      onChange("");
      return;
    }

    const trimmed = rawValue.trim();

    // Try parsing as full E.164 / international number only if input explicitly starts with '+'
    if (trimmed.startsWith("+")) {
      const formatter = new AsYouType();
      formatter.input(trimmed);
      const parsedCountry = formatter.getCountry();
      if (parsedCountry) {
        if (parsedCountry !== country) {
          setCountry(parsedCountry as Country);
        }
        const fullParsed = parsePhoneNumberFromString(trimmed);
        onChange(fullParsed?.number || toE164(formatter.getNationalNumber() || "", parsedCountry as CountryCode));
        return;
      }
    }

    let digits = parseIncompletePhoneNumber(rawValue);
    if (!digits) {
      onChange("");
      return;
    }

    // If autofill included country code without '+', strip leading calling code if it matches current country
    if (digits.startsWith(callingCode) && digits.length > (MAX_NATIONAL_LENGTHS[country] || 10)) {
      digits = digits.slice(callingCode.length);
    }

    // Smart Detect: If input without '+' is invalid for current country, check if it forms a complete valid number for any other country (e.g. pasting US number in UK or UK number in Germany)
    const candidateCurrent = toE164(digits, country as CountryCode);
    const parsedCurrent = parsePhoneNumberFromString(candidateCurrent);
    if (!parsedCurrent || !parsedCurrent.isValid()) {
      const fullParsed = parsePhoneNumberFromString(`+${trimmed}`);
      if (fullParsed && fullParsed.isValid() && fullParsed.country) {
        if (fullParsed.country !== country) {
          setCountry(fullParsed.country as Country);
        }
        onChange(fullParsed.number);
        return;
      }
    }

    // Limit digit input length based on country metadata to prevent typing extra numbers
    const maxLen = (MAX_NATIONAL_LENGTHS[country] || 15) + (digits.startsWith("0") ? 1 : 0);
    if (digits.length > maxLen) {
      return;
    }

    const candidate = toE164(digits, country as CountryCode);
    if (validatePhoneNumberLength(candidate, country as CountryCode) === "TOO_LONG") {
      return;
    }

    const formatter = new AsYouType(country as CountryCode);
    formatter.input(digits);
    const trimmedNational = formatter.getNationalNumber() || digits;
    onChange(toE164(trimmedNational, country as CountryCode));
  };

  return (
    <div className={cn("tti-phone-input PhoneInput", className)}>
      <PhoneCountrySelect
        value={country}
        onChange={handleCountryChange}
        options={countryOptions}
        iconComponent={CountryFlag}
        disabled={disabled}
      />
      <span className="tti-phone-prefix" aria-hidden>
        +{callingCode}
      </span>
      <input
        id={id}
        name="tel"
        type="tel"
        inputMode="tel"
        autoComplete="tel tel-national"
        disabled={disabled}
        value={displayValue}
        onChange={handleNationalChange}
        placeholder="555 123 4567"
        className="PhoneInputInput tti-phone-national"
      />
    </div>
  );
}
