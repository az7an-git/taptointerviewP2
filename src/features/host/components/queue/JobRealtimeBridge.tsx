import { useJobRealtime } from "@/hooks/useJobRealtime";

/** Invisible listener that keeps a job's queue in sync via realtime. */
export function JobRealtimeBridge({
  jobId,
  onUpdate,
}: {
  jobId: string;
  onUpdate: () => void;
}) {
  useJobRealtime(jobId, onUpdate);
  return null;
}
