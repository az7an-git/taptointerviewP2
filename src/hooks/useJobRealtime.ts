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
  "window_closing_warning",
  "window_close_prompt",
  "window_request_created",
  "window_request_reviewed",
] as const;

const JOB_CREDIT_EVENTS = [
  "credits_updated",
  "low_credits_warning",
  "credits_depleted",
  "credit_returned",
] as const;

export interface JobRealtimeCallbacks {
  onWindowClosingWarning?: (payload: any) => void;
  onWindowClosePrompt?: (payload: any) => void;
  onWindowRequestCreated?: (payload: any) => void;
  onWindowRequestReviewed?: (payload: any) => void;
}

export function useJobRealtime(
  jobId: string | undefined,
  onUpdate: () => void,
  callbacks?: JobRealtimeCallbacks
) {
  const { setCompanyBalance } = useAuth();

  const handlers = useMemo(() => {
    const queueHandlers = Object.fromEntries(
      JOB_QUEUE_EVENTS.map((event) => [
        event,
        (payload: unknown) => {
          if (event === "window_closing_warning") callbacks?.onWindowClosingWarning?.(payload);
          if (event === "window_close_prompt") callbacks?.onWindowClosePrompt?.(payload);
          if (event === "window_request_created") callbacks?.onWindowRequestCreated?.(payload);
          if (event === "window_request_reviewed") callbacks?.onWindowRequestReviewed?.(payload);
          onUpdate();
        },
      ])
    ) as Record<string, (payload: unknown) => void>;

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
  }, [onUpdate, callbacks, setCompanyBalance]);

  useRealtimeChannel(jobId ? `job:${jobId}` : null, handlers, {
    onSubscribed: onUpdate,
  });
}
