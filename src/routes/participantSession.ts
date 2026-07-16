/** Call when the user starts a new job application (clears prior session). */
export function resetParticipantApplicationSession() {
  localStorage.removeItem("participant_token");
  localStorage.removeItem("screening_token");
  localStorage.removeItem("screening_attempt_id");
  localStorage.removeItem("screening_step_complete");
  localStorage.removeItem("queue_entry_id");
  localStorage.removeItem("queue_position");
}

export function markScreeningStepComplete() {
  localStorage.setItem("screening_step_complete", "true");
}
