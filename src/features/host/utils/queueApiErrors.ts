export function getQueueApiErrorMessage(error: unknown, fallback: string): string {
    const err = error as {
        response?: { data?: { data?: unknown; message?: unknown } };
    };
    const msg = err?.response?.data?.data ?? err?.response?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
    return fallback;
}
