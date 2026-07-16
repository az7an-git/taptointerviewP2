import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { jobsApi } from "@/api/jobsApi";
import type { JobApplicant, SaveOutcomePayload } from "@/types/job";
import {
    mergeApplicantUpdate,
    normalizeQueueStatus,
    QUEUE_OUTCOME_LABELS,
} from "../utils/queueEntryStatus";
import { getQueueApiErrorMessage } from "../utils/queueApiErrors";

export type SessionAction = "start" | "end" | SaveOutcomePayload["outcome"] | null;

export function isSavingOutcome(sessionAction: SessionAction): boolean {
    return (
        sessionAction !== null &&
        sessionAction !== "start" &&
        sessionAction !== "end"
    );
}

export function useQueueCardSession(
    jobId: string,
    sessionCandidate: JobApplicant | undefined,
    setLocalApplicants: Dispatch<SetStateAction<JobApplicant[] | undefined>>,
    onSessionChange?: () => void
) {
    const [sessionAction, setSessionAction] = useState<SessionAction>(null);
    const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);

    const sessionStatus = sessionCandidate
        ? normalizeQueueStatus(sessionCandidate.status)
        : null;

    const handleStartSession = useCallback(async () => {
        if (!sessionCandidate) return;
        setSessionAction("start");
        try {
            const res = await jobsApi.startSession(jobId, sessionCandidate.queueEntryId);
            if (res.data) {
                if (res.data.roomUrl) {
                    localStorage.setItem(`roomUrl_${sessionCandidate.queueEntryId}`, res.data.roomUrl);
                }
                if (res.data.hostToken) {
                    localStorage.setItem(`hostToken_${sessionCandidate.queueEntryId}`, res.data.hostToken);
                }
                setLocalApplicants((prev) => mergeApplicantUpdate(prev, res.data));
                toast.success("Interview started.");
                onSessionChange?.();
            }
        } catch (error: unknown) {
            toast.error(getQueueApiErrorMessage(error, "Failed to start interview."));
        } finally {
            setSessionAction(null);
        }
    }, [jobId, sessionCandidate, setLocalApplicants, onSessionChange]);

    const handleEndSession = useCallback(async () => {
        if (!sessionCandidate) return;
        setSessionAction("end");
        try {
            const res = await jobsApi.endSession(jobId, sessionCandidate.queueEntryId);
            if (res.data) {
                setLocalApplicants((prev) => mergeApplicantUpdate(prev, res.data));
                toast.success("Interview ended. Record an outcome to call the next person.");
                setOutcomeModalOpen(true);
            }
        } catch (error: unknown) {
            toast.error(getQueueApiErrorMessage(error, "Failed to end interview."));
        } finally {
            setSessionAction(null);
        }
    }, [jobId, sessionCandidate, setLocalApplicants]);

    const handleSaveOutcome = useCallback(
        async (payload: SaveOutcomePayload) => {
            if (!sessionCandidate) return;
            setSessionAction(payload.outcome);
            try {
                const res = await jobsApi.saveOutcome(
                    jobId,
                    sessionCandidate.queueEntryId,
                    payload
                );
                if (res.data) {
                    setLocalApplicants((prev) => mergeApplicantUpdate(prev, res.data));
                    toast.success(`Outcome saved: ${QUEUE_OUTCOME_LABELS[payload.outcome].label}.`);
                    setOutcomeModalOpen(false);
                    onSessionChange?.();
                }
            } catch (error: unknown) {
                toast.error(getQueueApiErrorMessage(error, "Failed to save outcome."));
            } finally {
                setSessionAction(null);
            }
        },
        [jobId, sessionCandidate, setLocalApplicants, onSessionChange]
    );

    return {
        sessionAction,
        sessionStatus,
        outcomeModalOpen,
        setOutcomeModalOpen,
        handleStartSession,
        handleEndSession,
        handleSaveOutcome,
        isSavingOutcome: isSavingOutcome(sessionAction),
    };
}
