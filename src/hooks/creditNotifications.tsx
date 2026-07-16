import { toast } from "sonner";

export const CREDITS_STATUS_TOAST_ID = "credits-status-v2";
export const CREDIT_RETURNED_TOAST_ID = "credit-returned";

const DEDUP_MS = 2500;
let lastToastKey = "";
let lastToastAt = 0;

function shouldSkipDuplicate(key: string): boolean {
  const now = Date.now();
  if (key === lastToastKey && now - lastToastAt < DEDUP_MS) return true;
  lastToastKey = key;
  lastToastAt = now;
  return false;
}

export function showCreditsStatusToast(message: string, variant: "error" | "warning") {
  const key = `${variant}:${message}`;
  if (shouldSkipDuplicate(key)) return;

  const handleAction = () => {
    window.dispatchEvent(new Event("open-credits-modal"));
    toast.dismiss(CREDITS_STATUS_TOAST_ID);
  };

  const content = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pr-1">
      <span className="text-[13px] sm:text-[14px] leading-tight sm:leading-snug font-medium text-inherit">{message}</span>
      <button
        onClick={handleAction}
        className={`shrink-0 self-end sm:self-auto px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-[12px] sm:text-[13px] font-medium shadow-sm transition-colors ${variant === "error"
          ? "bg-white text-red-950 hover:bg-gray-50"
          : "bg-white text-amber-950 hover:bg-gray-50"
          }`}
      >
        Purchase
      </button>
    </div>
  );

  const options = {
    id: CREDITS_STATUS_TOAST_ID,
    classNames: {
      toast: "!items-start sm:!items-center",
    },
  };

  if (variant === "error") {
    toast.error(content, options);
  } else {
    toast.warning(content, options);
  }
}

export function dismissCreditsStatusToast() {
  toast.dismiss(CREDITS_STATUS_TOAST_ID);
}

export function showCreditReturnedToast(message: string) {
  const key = `returned:${message}`;
  if (shouldSkipDuplicate(key)) return;
  toast.success(message, { id: CREDIT_RETURNED_TOAST_ID });
}

type ApiErrorBody = {
  code?: unknown;
  data?: unknown;
  message?: unknown;
  billing_url?: unknown;
};

function extractApiMessage(error: unknown): string | undefined {
  const body = (error as { response?: { data?: ApiErrorBody } })?.response?.data;
  const msg = body?.data ?? body?.message;
  return typeof msg === "string" && msg.trim() ? msg : undefined;
}

const CREDITS_ERROR_CODES = new Set([
  "credits_depleted",
  "no_credits",
  "insufficient_credits",
  "low_credits",
]);

const CREDITS_ERROR_PHRASES = [
  "no credits",
  "credits remaining",
  "out of credits",
  "insufficient credit",
  "purchase more",
  "low on interview credits",
] as const;

/** Detect credit-related API failures without relying on a single keyword. */
export function isCreditsRelatedApiError(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: ApiErrorBody } })?.response;
  if (response?.status === 402) return true;

  const code = response?.data?.code;
  if (typeof code === "string" && CREDITS_ERROR_CODES.has(code.toLowerCase())) return true;
  if (typeof code === "string" && /credit/i.test(code)) return true;

  const message = extractApiMessage(error);
  if (!message) return false;
  const lower = message.toLowerCase();
  return CREDITS_ERROR_PHRASES.some((phrase) => lower.includes(phrase));
}

/** Show a deduped credits toast for API errors. Returns true when handled. */
export function tryShowCreditsApiError(error: unknown, fallback: string): boolean {
  if (!isCreditsRelatedApiError(error)) return false;
  const message = extractApiMessage(error) || fallback;
  showCreditsStatusToast(message, "error");
  return true;
}
