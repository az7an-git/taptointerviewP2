import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { createCreditRealtimeHandlers } from "./realtimeCreditHandlers";

const JOB_QUEUE_EVENTS = [
  "participant_called",
  "participant_admitted",
  "participant_missed",
  "queue_joined",
  "queue_status_changed",
  "session_started",
  "session_ended",
  "outcome_saved",
  "queue_windows_updated",
] as const;

const JOB_CREDIT_EVENTS = [
  "credits_updated",
  "low_credits_warning",
  "credits_depleted",
  "credit_returned",
] as const;

export function useJobRealtime(jobId: string | undefined, onUpdate: () => void) {
  const { setCompanyBalance } = useAuth();

  const handlers = useMemo(() => {
    const queueHandlers = Object.fromEntries(
      JOB_QUEUE_EVENTS.map((event) => [event, onUpdate])
    ) as Record<string, () => void>;

    const creditHandlers = createCreditRealtimeHandlers(setCompanyBalance, { showToasts: false });
    const wrappedCreditHandlers = Object.fromEntries(
      JOB_CREDIT_EVENTS.map((event) => [
        event,
        (payload: unknown) => {
          creditHandlers[event](payload);
          onUpdate();
        },
      ])
    );

    return { ...queueHandlers, ...wrappedCreditHandlers };
  }, [onUpdate, setCompanyBalance]);

  useRealtimeChannel(jobId ? `job:${jobId}` : null, handlers, {
    onSubscribed: onUpdate,
  });
}
