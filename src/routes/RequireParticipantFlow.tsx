import { Navigate, useParams } from "react-router-dom";

export type ParticipantFlowRequirement = "job" | "screeningPassed" | "participant";

interface RequireParticipantFlowProps {
  requirement: ParticipantFlowRequirement;
  children: React.ReactNode;
}

/** Guards candidate routes so users cannot skip steps by typing URLs manually. */
export default function RequireParticipantFlow({
  requirement,
  children,
}: RequireParticipantFlowProps) {
  const { slug } = useParams();

  if (!slug) {
    return <Navigate to="/login" replace />;
  }

  const jobsListPath = `/company/${slug}`;
  const storedJobId = localStorage.getItem("selectedJobId");
  const storedSlug = localStorage.getItem("selectedCompanySlug");
  const slugMatches = !storedSlug || storedSlug === slug;
  const screenPath = `/company/${slug}/screen`;
  const detailsPath = `/company/${slug}/details`;

  const hasJobContext = Boolean(storedJobId && slugMatches);
  const hasScreeningAccess =
    Boolean(localStorage.getItem("screening_token")) ||
    localStorage.getItem("screening_step_complete") === "true";
  const hasParticipantSession = Boolean(localStorage.getItem("participant_token"));

  if (requirement === "job" && !hasJobContext) {
    return <Navigate to={jobsListPath} replace />;
  }

  if (requirement === "screeningPassed") {
    if (!hasJobContext) {
      return <Navigate to={jobsListPath} replace />;
    }
    if (!hasScreeningAccess) {
      return <Navigate to={screenPath} replace />;
    }
  }

  if (requirement === "participant" && !hasParticipantSession) {
    if (hasScreeningAccess) {
      return <Navigate to={detailsPath} replace />;
    }
    if (hasJobContext) {
      return <Navigate to={screenPath} replace />;
    }
    return <Navigate to={jobsListPath} replace />;
  }

  return <>{children}</>;
}
