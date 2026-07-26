export interface LocalWindowInput {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Picker date/time in the user's local zone → UTC ISO for the API (always ends with Z). */
export function localPickerToUtcIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute = 0] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export function buildWindowRange(input: LocalWindowInput): {
  startTime: string;
  endTime: string;
} {
  return {
    startTime: localPickerToUtcIso(input.startDate, input.startTime),
    endTime: localPickerToUtcIso(input.endDate, input.endTime),
  };
}

type WindowParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function windowIsoToMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? NaN : ms;
}

/** Local wall-clock parts for labels and date pickers. */
export function parseWindowIso(iso: string): WindowParts | null {
  const ms = windowIsoToMs(iso);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

export function getWindowCountdownLabel(startsAt: string, serverNowMs: number): string {
  const targetMs = windowIsoToMs(startsAt);
  if (Number.isNaN(targetMs) || Number.isNaN(serverNowMs)) return "Opens soon";

  const diffMs = targetMs - serverNowMs;
  // if (diffMs <= 0) return "Opens soon";  
  if (diffMs <= 0) return "Opening...";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 1) {
    return `Starts in ${diffMins} min${diffMins !== 1 ? "s" : ""}`;
  }
  if (diffHours < 24) {
    if (diffMins > 0) {
      return `Starts in ${diffHours} hr${diffHours !== 1 ? "s" : ""} ${diffMins} min${diffMins !== 1 ? "s" : ""}`;
    }
    return `Starts in ${diffHours} hr${diffHours !== 1 ? "s" : ""}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Starts in ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
}

export function formatWindowIso(iso: string): { date: string; time: string } {
  const parts = parseWindowIso(iso);
  if (!parts) return { date: "", time: "" };

  const date = new Date(parts.year, parts.month - 1, parts.day).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const period = parts.hour >= 12 ? "PM" : "AM";
  let hour12 = parts.hour % 12;
  if (hour12 === 0) hour12 = 12;
  const time = `${hour12}:${pad2(parts.minute)} ${period}`;

  return { date, time };
}

/** Normalize API instants to canonical UTC ISO (Z). */
export function normalizeWindowIsoFromApi(value: string): string {
  const ms = windowIsoToMs(value);
  if (Number.isNaN(ms)) return value.trim();
  return new Date(ms).toISOString();
}

/** Ensure PUT payloads use UTC ISO with Z. */
export function windowIsoToApi(value: string): string {
  return normalizeWindowIsoFromApi(value);
}
