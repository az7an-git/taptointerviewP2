import {
  dismissCreditsStatusToast,
  showCreditReturnedToast,
  showCreditsStatusToast,
} from "./creditNotifications";

type CreditPayload = {
  balance?: number;
  credits_remaining?: number;
  message?: string;
  level?: string;
  reason?: string;
};

function getBalance(payload: CreditPayload): number | undefined {
  if (typeof payload.balance === "number") return payload.balance;
  if (typeof payload.credits_remaining === "number") return payload.credits_remaining;
  return undefined;
}

type CreditHandlerOptions = {
  /** Company channel shows toasts; job channel only syncs balance. */
  showToasts?: boolean;
};

export function createCreditRealtimeHandlers(
  setCompanyBalance: (balance: number) => void,
  { showToasts = true }: CreditHandlerOptions = {}
): Record<string, (payload: unknown) => void> {
  return {
    credits_updated: (payload) => {
      const p = payload as CreditPayload;
      const balance = getBalance(p);
      if (typeof balance !== "number") return;

      setCompanyBalance(balance);
      if (!showToasts) return;

      setTimeout(() => {
        if (balance === 0) {
          showCreditsStatusToast(
            p.message || "No credits remaining. Purchase more to continue interviews.",
            "error"
          );
        } else if (balance <= 5) {
          showCreditsStatusToast(
            p.message ||
              `You're running low on interview credits — ${balance} remaining. Purchase more to keep your waiting room running.`,
            "warning"
          );
        } else {
          dismissCreditsStatusToast();
        }
      }, 1500);
    },
    low_credits_warning: (payload) => {
      const p = payload as CreditPayload;
      const remaining = getBalance(p);
      if (typeof remaining === "number") setCompanyBalance(remaining);
      if (!showToasts) return;

      showCreditsStatusToast(
        p.message ||
          `You're running low on interview credits — ${remaining ?? "?"} remaining. Purchase more to keep your waiting room running.`,
        "warning"
      );
    },
    credits_depleted: (payload) => {
      const p = payload as CreditPayload;
      setCompanyBalance(getBalance(p) ?? 0);
      if (!showToasts) return;

      showCreditsStatusToast(
        p.message || "No credits remaining. Purchase more to continue interviews.",
        "error"
      );
    },
    credit_returned: (payload) => {
      const p = payload as CreditPayload;
      const balance = getBalance(p);
      if (typeof balance === "number") {
        setCompanyBalance(balance);
      }
      if (!showToasts) return;

      const message =
        p.message ||
        (p.level === "n20" || p.reason === "return_no_answer"
          ? "1 credit has been returned — candidate did not respond within 90 seconds."
          : p.level === "n21"
            ? "1 credit has been returned — the interview failed to connect within the grace period."
            : undefined);
      if (message) {
        showCreditReturnedToast(message);
      }
    },
  };
}
