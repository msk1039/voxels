import { useSyncExternalStore } from "react";

const DESKTOP_BREAKPOINT = 1024;

export function useIsDesktop() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;
      const media = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.innerWidth >= DESKTOP_BREAKPOINT,
    () => false
  );
}
