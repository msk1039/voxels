import { useSyncExternalStore } from "react";

export function useDevicePixelRatio() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener("resize", onStoreChange);
      return () => window.removeEventListener("resize", onStoreChange);
    },
    () => window.devicePixelRatio,
    () => 1
  );
}
