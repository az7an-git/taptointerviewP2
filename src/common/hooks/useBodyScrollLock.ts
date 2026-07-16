import { useEffect } from "react";

export function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const scrollY = window.scrollY;
    const body = document.body;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflowY = "scroll"; // keep scrollbar space so layout doesn't shift

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflowY = "";
      window.scrollTo(0, scrollY);
    };
  }, [enabled]);
}
