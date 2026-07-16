import { useEffect, useRef, useCallback, useState } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import { participantApi } from "@/api/participantApi";

export type DailySessionStatus =
  | "idle"
  | "fetching"       // fetching room URL from backend
  | "joining"        // callFrame.join() in progress
  | "joined"         // live in the call
  | "left"           // participant left or host ended session
  | "error";

export interface UseDailySessionOptions {
  /** DOM element to mount the call frame into */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Direct Daily room URL (if available, skips fetching) */
  roomUrl?: string;
  /** Direct Daily token (if available, skips fetching) */
  token?: string;
  /** Called when the participant successfully joins the room */
  onJoined?: () => void;
  /** Called when another participant (e.g. candidate) joins the room */
  onParticipantJoined?: (participant: any) => void;
  /** Called when another participant leaves the room */
  onParticipantLeft?: (participant: any) => void;
  /** Called when the call ends (either side leaves) */
  onLeft?: () => void;
  /** Called on any Daily error */
  onError?: (message: string) => void;
}

export interface UseDailySessionReturn {
  status: DailySessionStatus;
  error: string | null;
  /** Trigger fetching the room URL and joining the call */
  joinSession: () => void;
  /** Gracefully leave the call */
  leaveSession: () => void;
}

export function useDailySession({
  containerRef,
  roomUrl: propRoomUrl,
  token: propToken,
  onJoined,
  onParticipantJoined,
  onParticipantLeft,
  onLeft,
  onError,
}: UseDailySessionOptions): UseDailySessionReturn {
  const [status, setStatus] = useState<DailySessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const callFrameRef = useRef<DailyCall | null>(null);

  /** Tear down the callFrame and clean up listeners */
  const destroyFrame = useCallback(async () => {
    const frame = callFrameRef.current;
    if (!frame) return;
    try {
      await frame.destroy();
    } catch {
      // ignore destroy errors
    }
    callFrameRef.current = null;
    
    // Safety fallback: empty the container just in case Daily leaves something behind
    if (containerRef.current) {
        containerRef.current.innerHTML = "";
    }
  }, [containerRef]);

  const leaveSession = useCallback(() => {
    const frame = callFrameRef.current;
    if (frame) {
      frame.leave().catch(() => null).finally(destroyFrame);
    }
    setStatus("left");
  }, [destroyFrame]);

  const joinSession = useCallback(async () => {
    if (status === "fetching" || status === "joining" || status === "joined") return;

    setError(null);
    setStatus("fetching");

    let roomUrl = propRoomUrl;
    let dailyToken = propToken;

    if (!roomUrl || !dailyToken) {
      const participantToken = localStorage.getItem("participant_token");
      if (!participantToken) {
        const msg = "No participant token found. Please restart the session flow.";
        setError(msg);
        setStatus("error");
        onError?.(msg);
        return;
      }

      // Step 6 — GET /participant/session/video
      try {
        const videoSession = await participantApi.getSessionVideo(participantToken);
        
        roomUrl = videoSession.url || (videoSession as any).room_url || (videoSession as any).roomUrl;
        dailyToken = videoSession.token || (videoSession as any).participant_token || (videoSession as any).daily_token || (videoSession as any).meeting_token;
        
        if (!roomUrl) {
          throw new Error("Backend did not return a valid Daily.co room URL. Found: " + JSON.stringify(videoSession));
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.data ??
          "Unable to retrieve the session details. Please try again.";
        setError(msg);
        setStatus("error");
        onError?.(msg);
        return;
      }
    }

    if (!containerRef.current) {
      const msg = "Video container is not ready. Please try again.";
      setError(msg);
      setStatus("error");
      onError?.(msg);
      return;
    }

    setStatus("joining");

    // Destroy any existing frame before creating a new one
    await destroyFrame();

    try {
      // Safety: check if there's any global instance attached to this container
      const existingInstances = DailyIframe.supportedBrowser().supported ? DailyIframe.getCallInstance() : null;
      if (existingInstances) {
          await existingInstances.destroy();
      }

      // Step 7 — callFrame.join({ url, token })
      const frame = DailyIframe.createFrame(containerRef.current as HTMLElement, {
        iframeStyle: {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
        },
        showLeaveButton: false,
        showFullscreenButton: true,
        theme: {
          colors: {
            accent: '#FF512F',
            accentText: '#FFFFFF',
            background: '#0B0F19',
            backgroundAccent: '#161B26',
            baseText: '#FFFFFF',
            border: '#ffffff1a',
            mainAreaBg: '#000000',
            mainAreaBgAccent: '#161B26',
            mainAreaText: '#FFFFFF',
            supportiveText: '#9CA3AF',
          }
        }
      });

      callFrameRef.current = frame;

      frame.on("joined-meeting", () => {
        setStatus("joined");
        onJoined?.();
        // Check if other participants are already in the meeting
        const participants = frame.participants();
        const otherKeys = Object.keys(participants).filter((key) => key !== "local");
        if (otherKeys.length > 0) {
          onParticipantJoined?.(participants[otherKeys[0]]);
        }
      });

      frame.on("participant-joined", (event: any) => {
        onParticipantJoined?.(event?.participant);
      });

      frame.on("participant-left", (event: any) => {
        onParticipantLeft?.(event?.participant);
      });

      frame.on("left-meeting", () => {
        setStatus("left");
        destroyFrame();
        onLeft?.();
      });

      frame.on("error", (event: any) => {
        const msg = event?.errorMsg ?? "A video call error occurred.";
        setError(msg);
        setStatus("error");
        destroyFrame();
        onError?.(msg);
      });

      await frame.join({ url: roomUrl, token: dailyToken });
    } catch (err: any) {
      const msg = err?.message ?? "Failed to join the video session.";
      setError(msg);
      setStatus("error");
      destroyFrame();
      onError?.(msg);
    }
  }, [
    status,
    containerRef,
    destroyFrame,
    onJoined,
    onParticipantJoined,
    onParticipantLeft,
    onLeft,
    onError,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyFrame();
    };
  }, [destroyFrame]);

  return { status, error, joinSession, leaveSession };
}
