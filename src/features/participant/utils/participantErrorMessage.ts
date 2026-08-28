export function getParticipantErrorMessage(
    err: unknown,
    fallback: string = "An error occurred. Please try again."
): string {
    if (!err) return fallback;
    const anyErr = err as any;
    const d = anyErr?.response?.data;
    if (d) {
        if (typeof d === "string" && d.trim()) return d;
        if (typeof d.data === "string" && d.data.trim()) return d.data;
        if (typeof d.message === "string" && d.message.trim()) return d.message;
        if (typeof d.error === "string" && d.error.trim()) return d.error;
    }
    if (typeof anyErr?.message === "string" && anyErr.message.trim()) {
        return anyErr.message;
    }
    return fallback;
}
