/** Offset so getNowMs() tracks server time between API responses. */
export type ServerClock = {
  getNowMs: () => number;
  sync: (serverTimeMs: number) => void;
};

export function createServerClock(initialServerTimeMs: number = Date.now()): ServerClock {
  let offsetMs = initialServerTimeMs - Date.now();

  return {
    getNowMs: () => Date.now() + offsetMs,
    sync: (serverTimeMs: number) => {
      offsetMs = serverTimeMs - Date.now();
    },
  };
}

/** Prefer explicit API fields; fall back to the HTTP Date header. */
export function parseServerTimeMs(body: unknown, dateHeader?: string | null): number {
  const root = body as Record<string, unknown> | undefined;
  const nested = root?.data as Record<string, unknown> | undefined;

  const candidate =
    nested?.server_time ??
    nested?.server_now ??
    root?.server_time ??
    root?.server_now;

  if (typeof candidate === "string") {
    const parsed = Date.parse(candidate);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate;
  }
  if (dateHeader) {
    const parsed = Date.parse(dateHeader);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}
