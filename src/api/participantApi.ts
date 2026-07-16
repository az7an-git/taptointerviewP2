import publicApi from "./publicApi";

export interface InspectResult {
  valid: true;
  queue_entry_id: string;
  status: string;
  remaining_seconds: number;
}

export interface InspectInvalid {
  valid: false;
  reason: "invalid" | "used" | "expired" | "invalid_status";
}

export type InspectResponse = InspectResult | InspectInvalid;

export interface ConfirmResult {
  queue_entry_id: string;
  job_id: string;
  company_id: string;
  status: string;
  participant_token: string;
  participant: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface NextInterviewWindow {
  starts_at: string;
  ends_at: string;
  status: string;
}

export interface ReserveResult {
  queue_entry_id: string;
  status: string;
  next_window?: NextInterviewWindow;
  message?: string;
}

export interface ReleaseResult {
  queue_entry_id: string;
  status: string;
  message?: string;
}

export interface VideoSessionResponse {
  /** Daily.co room URL to pass into callFrame.join() */
  url: string;
  /** Daily.co meeting token for the participant */
  token: string;
}

export const participantApi = {
  inspectAdmission: async (token: string): Promise<InspectResponse> => {
    const response = await publicApi.get<{
      status: string;
      data: InspectResponse;
    }>("/participant/admission/inspect", { params: { token } });
    return response.data.data;
  },

  confirmAdmission: async (token: string): Promise<ConfirmResult> => {
    const response = await publicApi.post<{
      status: string;
      data: ConfirmResult;
    }>("/participant/admission/confirm", { token });
    return response.data.data;
  },
  reserveSpot: async (token: string) => {
    const response = await publicApi.post<{
      status: string;
      data: ReserveResult;
    }>("/participant/queue/reserve", { token });
    return response.data;
  },

  releasePosition: async (token: string) => {
    const response = await publicApi.post<{
      status: string;
      data: ReleaseResult;
    }>("/participant/queue/release", { token });
    return response.data;
  },

  /**
   * Fetch the Daily.co room URL and participant token for the active session.
   * GET /participant/session/video
   * Auth: Bearer <participant_token>
   */
  getSessionVideo: async (participantToken: string): Promise<VideoSessionResponse> => {
    const response = await publicApi.get<{
      status: string;
      data: VideoSessionResponse;
    }>("/participant/session/video", {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    return response.data.data;
  },

  /**
   * Fetch the participant's current queue status.
   * GET /participant/queue/status
   * Auth: Bearer <participant_token>
   */
  getQueueStatus: async (participantToken: string) => {
    const response = await publicApi.get<{
      status: string;
      data: { status: string };
    }>("/participant/queue/status", {
      headers: { Authorization: `Bearer ${participantToken}` },
    });
    return response.data.data;
  },
};
