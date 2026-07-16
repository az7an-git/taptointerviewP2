import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

/** Old /called URLs — go back if possible, otherwise waiting room. */
export default function LegacyCalledRedirect() {
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    const fallback = slug ? `/company/${slug}/status` : "/";

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback, { replace: true });
  }, [navigate, slug]);

  return null;
}
