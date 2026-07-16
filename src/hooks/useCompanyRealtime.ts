import { useAuth } from "@/context/AuthContext";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { createCreditRealtimeHandlers } from "./realtimeCreditHandlers";
import { toast } from "sonner";
import { useMemo } from "react";

export function useCompanyRealtime() {
  const { user, setCompanyBalance } = useAuth();
  const companyId = user?.company?.id as string | undefined;

  const handlers = useMemo(
    () => ({
      ...createCreditRealtimeHandlers(setCompanyBalance),
      employer_idle_warning: (payload: unknown) => {
        const message = (payload as { message?: string })?.message;
        toast.warning(message || "Are you still there? Candidates may be waiting in your interview queue.", {
          duration: 10000,
        });
      },
    }),
    [setCompanyBalance]
  );

  useRealtimeChannel(companyId ? `company:${companyId}` : null, handlers);
}
