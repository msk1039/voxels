"use client";

import { RefObject, useEffect, useState } from "react";

export function useRenderVisibility(
  containerRef: RefObject<HTMLElement | null>
) {
  const [pageVisible, setPageVisible] = useState(true);
  const [inViewport, setInViewport] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageVisible(document.visibilityState === "visible");
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return pageVisible && inViewport;
}
