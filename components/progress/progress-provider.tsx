"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  EMPTY_PROGRESS,
  LevelCompletion,
  ProgressState,
  applyLevelCompletion,
  clearLevelProgress,
  loadProgress,
  saveProgress,
} from "@/lib/progress";

interface ProgressContextValue {
  progress: ProgressState;
  completeLevel: (completion: LevelCompletion) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const listeners = new Set<() => void>();
let cachedProgress: ProgressState = EMPTY_PROGRESS;
let loaded = false;

function emitChange() {
  for (const listener of listeners) listener();
}

function readBrowserProgress() {
  if (!loaded && typeof window !== "undefined") {
    cachedProgress = loadProgress(window.localStorage);
    loaded = true;
  }
  return cachedProgress;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "voxels:level-progress:v1") {
      cachedProgress = loadProgress(window.localStorage);
      loaded = true;
      emitChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeProgress(progress: ProgressState) {
  cachedProgress = progress;
  loaded = true;
  saveProgress(window.localStorage, progress);
  emitChange();
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const progress = useSyncExternalStore(
    subscribe,
    readBrowserProgress,
    () => EMPTY_PROGRESS
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      completeLevel: (completion) => {
        writeProgress(applyLevelCompletion(readBrowserProgress(), completion));
      },
      resetProgress: () => {
        clearLevelProgress(window.localStorage);
        cachedProgress = EMPTY_PROGRESS;
        loaded = true;
        emitChange();
      },
    }),
    [progress]
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within ProgressProvider.");
  }
  return context;
}
