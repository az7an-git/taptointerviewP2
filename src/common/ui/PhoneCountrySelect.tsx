import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import type { Country } from "react-phone-number-input";
import { cn } from "@/lib/utils";

type CountryOption = {
  value?: string;
  label: string;
  divider?: boolean;
};

type IconComponentProps = {
  country?: Country;
  label?: string;
  aspectRatio?: number;
};

type PhoneCountrySelectProps = {
  value?: Country;
  onChange: (value?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent: React.ComponentType<IconComponentProps>;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
};

type MenuLayout =
  | { mode: "sheet" }
  | { mode: "dropdown"; top: number; left: number; width: number; maxHeight: number };

const MOBILE_BREAKPOINT = 640;
const VIEWPORT_PADDING = 12;

function isMobileViewport() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getMenuLayout(trigger: HTMLButtonElement): MenuLayout {
  if (isMobileViewport()) {
    return { mode: "sheet" };
  }

  const rect = trigger.getBoundingClientRect();
  const minWidth = 280;
  const maxWidth = 320;
  let width = Math.min(Math.max(rect.width, minWidth), maxWidth);
  let left = rect.left;

  if (left + width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - VIEWPORT_PADDING - width;
  }
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
    width = Math.min(width, window.innerWidth - VIEWPORT_PADDING * 2);
  }

  const top = rect.bottom + 6;
  const maxHeight = Math.max(160, window.innerHeight - top - VIEWPORT_PADDING);

  return { mode: "dropdown", top, left, width, maxHeight };
}

export function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  iconComponent: Icon,
  onFocus,
  onBlur,
  className,
}: PhoneCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const countryOptions = useMemo(
    () => options.filter((opt) => !opt.divider && opt.value),
    [options]
  );

  const selectedOption = useMemo(
    () => countryOptions.find((opt) => opt.value === value),
    [countryOptions, value]
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countryOptions;
    return countryOptions.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [countryOptions, search]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch("");
    setMenuLayout(null);
    onBlur?.();
  }, [onBlur]);

  const open = useCallback(() => {
    if (disabled || readOnly || !triggerRef.current) return;
    setMenuLayout(getMenuLayout(triggerRef.current));
    setIsOpen(true);
    onFocus?.();
  }, [disabled, readOnly, onFocus]);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    setMenuLayout(getMenuLayout(triggerRef.current));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen, close, reposition]);

  useEffect(() => {
    if (!isOpen || menuLayout?.mode !== "sheet") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, menuLayout?.mode]);

  const handleSelect = (country?: string) => {
    onChange(country as Country | undefined);
    close();
  };

  const isSheet = menuLayout?.mode === "sheet";

  return (
    <div className={cn("PhoneInputCountry tti-phone-country", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || readOnly}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => (isOpen ? close() : open())}
        className="tti-phone-country__trigger"
      >
        {value && (
          <Icon
            aria-hidden
            country={value}
            label={selectedOption?.label}
          />
        )}
        <ChevronDown
          className={cn(
            "tti-phone-country__chevron",
            isOpen && "tti-phone-country__chevron--open"
          )}
        />
      </button>

      {isOpen && menuLayout &&
        createPortal(
          <>
            {isSheet && (
              <button
                type="button"
                aria-label="Close country list"
                className="tti-phone-country__backdrop"
                onClick={close}
              />
            )}
            <div
              ref={menuRef}
              className={cn(
                "tti-phone-country__menu",
                isSheet && "tti-phone-country__menu--sheet"
              )}
              style={
                menuLayout.mode === "dropdown"
                  ? {
                      top: menuLayout.top,
                      left: menuLayout.left,
                      width: menuLayout.width,
                      maxHeight: menuLayout.maxHeight,
                    }
                  : undefined
              }
              role="listbox"
            >
              {isSheet && (
                <div className="tti-phone-country__sheet-header">
                  <span className="tti-phone-country__sheet-title">Select country</span>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={close}
                    className="tti-phone-country__close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="tti-phone-country__search">
                <Search className="tti-phone-country__search-icon" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="tti-phone-country__search-input"
                  autoFocus
                />
              </div>
              <div className="tti-phone-country__list">
                {filteredOptions.length === 0 ? (
                  <p className="tti-phone-country__empty">No countries found</p>
                ) : (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={opt.value === value}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "tti-phone-country__option",
                        opt.value === value && "tti-phone-country__option--selected"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
