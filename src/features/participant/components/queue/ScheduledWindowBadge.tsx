import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatWindowIso, getWindowCountdownLabel, parseWindowIso } from "@/common/utils/queueWindowDatetime";

interface ScheduledWindowProps {
  startsAt: string;
  getServerNowMs: () => number;
}

const COUNTDOWN_TICK_MS = 1000;

function formatScheduledWindowDateTime(startsAt: string): string | null {
  const parts = parseWindowIso(startsAt);
  if (!parts) return null;
  const dateStr = new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const { time } = formatWindowIso(startsAt);
  return `${dateStr} at ${time}`;
}

/** Formatted text label: e.g. "Next Window: May 19 at 12:35 AM" */
export function ScheduledWindowLabel({ startsAt }: Omit<ScheduledWindowProps, "getServerNowMs">) {
  const label = formatScheduledWindowDateTime(startsAt);

  return (
    <span className="flex items-center gap-1 text-amber-400 text-[10px] sm:text-[12px] truncate max-w-[280px]">
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      Next Window: {label ?? "Opens soon"}
    </span>
  );
}

/** Beating amber countdown tag driven by server time, not the visitor's clock. */
export function ScheduledWindowCountdown({ startsAt, getServerNowMs }: ScheduledWindowProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), COUNTDOWN_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const label = getWindowCountdownLabel(startsAt, getServerNowMs());

  return (
    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-2 rounded-lg border border-amber-500/20 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
      {label}
    </span>
  );
}
