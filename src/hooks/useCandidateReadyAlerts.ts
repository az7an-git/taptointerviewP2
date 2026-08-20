import { useEffect, useRef, useState, useCallback } from "react";
import { jobsApi } from "@/api/jobsApi";

/**
 * Play a modern multi-tone notification chime using Web Audio API synthesis
 * Works cross-browser without requiring external audio file assets.
 */
export function playCandidateReadyChime() {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        // Tone sequence: 523.25 Hz (C5) -> 659.25 Hz (E5) -> 783.99 Hz (G5)
        const tones = [523.25, 659.25, 783.99];
        const startTime = ctx.currentTime + 0.05;

        tones.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, startTime + i * 0.12);

            gain.gain.setValueAtTime(0, startTime + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.25, startTime + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.12 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime + i * 0.12);
            osc.stop(startTime + i * 0.12 + 0.38);
        });
    } catch (err) {
        console.warn("Audio chime playback error:", err);
    }
}

interface UseCandidateReadyAlertsOptions {
    isCandidateReady: boolean;
    jobTitle?: string;
}

export function useCandidateReadyAlerts({ isCandidateReady, jobTitle }: UseCandidateReadyAlertsOptions) {
    const [alertsEnabled, setAlertsEnabled] = useState<boolean | null>(null); // null = not yet loaded
    const titleIntervalRef = useRef<any>(null);
    const originalTitleRef = useRef<string>(document.title);
    // Initialize to current value so existing candidates don't re-trigger on mount
    const prevReadyRef = useRef<boolean>(isCandidateReady);

    // Fetch employer notification settings
    useEffect(() => {
        jobsApi.getNotificationSettings()
            .then((res) => {
                if (res.data?.candidate_ready_alerts_enabled !== undefined) {
                    setAlertsEnabled(res.data.candidate_ready_alerts_enabled);
                } else {
                    setAlertsEnabled(true); // default enabled if field is missing
                }
            })
            .catch((err) => {
                console.warn("Failed to load employer notification settings:", err);
                setAlertsEnabled(true); // default enabled on error
            });
    }, []);

    // Update notification settings preference
    const toggleAlerts = useCallback(async (enabled: boolean) => {
        setAlertsEnabled(enabled);
        try {
            await jobsApi.updateNotificationSettings({ candidate_ready_alerts_enabled: enabled });
        } catch (err) {
            console.warn("Failed to update notification settings:", err);
        }
    }, []);

    // Trigger sensory alerts (Sound Chime + Tab Title Flashing)
    useEffect(() => {
        // Don't fire anything until settings are loaded from the API
        if (alertsEnabled === null) return;

        // Only fire when transitioning from not ready to ready
        const justBecameReady = isCandidateReady && !prevReadyRef.current;
        prevReadyRef.current = isCandidateReady;

        if (isCandidateReady && alertsEnabled) {
            if (justBecameReady) {
                playCandidateReadyChime();
            }

            // Tab Title Flashing when unfocused or tab hidden
            originalTitleRef.current = document.title;
            let toggle = false;

            if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
            titleIntervalRef.current = setInterval(() => {
                if (document.hidden || !document.hasFocus()) {
                    document.title = toggle
                        ? `🔔(1) Candidate Ready! - ${jobTitle || "Tap to Interview"}`
                        : `⚡ Interview Ready! - ${jobTitle || "Tap to Interview"}`;
                    toggle = !toggle;
                } else {
                    document.title = originalTitleRef.current;
                }
            }, 1000);
        } else {
            if (titleIntervalRef.current) {
                clearInterval(titleIntervalRef.current);
                titleIntervalRef.current = null;
            }
            if (originalTitleRef.current) {
                document.title = originalTitleRef.current;
            }
        }

        return () => {
            if (titleIntervalRef.current) {
                clearInterval(titleIntervalRef.current);
                titleIntervalRef.current = null;
            }
        };
    }, [isCandidateReady, alertsEnabled, jobTitle]);

    return { alertsEnabled: alertsEnabled ?? true, toggleAlerts };
}
