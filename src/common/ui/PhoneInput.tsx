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

  const handleNationalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = parseIncompletePhoneNumber(event.target.value);
    if (!digits) {
      onChange("");
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
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        value={displayValue}
        onChange={handleNationalChange}
        placeholder="555 123 4567"
        className="PhoneInputInput tti-phone-national"
      />
    </div>
  );
}
