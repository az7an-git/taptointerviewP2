import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeChannel } from "./useRealtimeChannel";

const COMPANY_QUEUE_EVENTS = [
  "queue_joined",
  "queue_status_changed",
  "participant_called",
  "participant_admitted",
  "participant_missed",
  "session_started",
  "session_ended",
  "outcome_saved",
  "queue_windows_updated",
] as const;

/** Refreshes active queue data when company- or job-level queue events fire. */
export function useCompanyQueueRealtime(onUpdate: () => void) {
  const { user } = useAuth();
  const companyId = user?.company?.id as string | undefined;

  const handlers = useMemo(
    () =>
      Object.fromEntries(
        COMPANY_QUEUE_EVENTS.map((event) => [event, onUpdate])
      ) as Record<string, () => void>,
    [onUpdate]
  );

  useRealtimeChannel(companyId ? `company:${companyId}` : null, handlers, {
    onSubscribed: onUpdate,
  });
}
