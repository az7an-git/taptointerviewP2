import { useState, useEffect } from "react";

export function useCalledWindowCountdown(
    admissionExpiresAt: string | null | undefined,
    isCalled: boolean,
    onExpired: () => void
) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!isCalled || !admissionExpiresAt) return;
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isCalled, admissionExpiresAt]);

    const secondsLeft = admissionExpiresAt
        ? Math.max(
              0,
              Math.floor((new Date(admissionExpiresAt).getTime() - now) / 1000)
          )
        : null;

    const isWindowExpired = isCalled && secondsLeft === 0;

    useEffect(() => {
        if (isWindowExpired) onExpired();
    }, [isWindowExpired, onExpired]);

    return { secondsLeft, isWindowExpired };
}
