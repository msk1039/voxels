"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { announceAchievements } from "@/components/game/achievement-toast";
import {
  Achievement,
  EMPTY_PROGRESS,
  LevelCompletion,
  PROGRESS_STORAGE_KEY,
  ProgressState,
  RunRecord,
  applyLevelCompletion,
  clearLevelProgress,
  findNewAchievements,
  loadProgress,
  recordHintOpened,
  recordRun,
  saveProgress,
  unlockAchievements,
} from "@/lib/progress";

export interface ProgressOutcome {
  previous: ProgressState;
  next: ProgressState;
  newAchievements: Achievement[];
}

interface ProgressContextValue {
  progress: ProgressState;
  completeLevel: (completion: LevelCompletion) => ProgressOutcome;
  recordRun: (run: RunRecord) => void;
  recordHintOpened: () => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const listeners = new Set<() => void>();
let cachedProgress: ProgressState = EMPTY_PROGRESS;
let loaded = false;

function emitChange() {
  for (const listener of listeners) listener();
}

/**
 * Loads stored progress and silently records achievements it already
 * earns, such as after migrating from a version without achievements.
 */
function loadWithAchievements() {
  const stored = loadProgress(window.localStorage);
  return unlockAchievements(
    stored,
    findNewAchievements(stored).map((achievement) => achievement.id)
  );
}

function readBrowserProgress() {
  if (!loaded && typeof window !== "undefined") {
    cachedProgress = loadWithAchievements();
    loaded = true;
  }
  return cachedProgress;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PROGRESS_STORAGE_KEY) {
      cachedProgress = loadWithAchievements();
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

/** Applies an update, records any achievements it earns, and announces them. */
function commit(update: (state: ProgressState) => ProgressState): ProgressOutcome {
  const previous = readBrowserProgress();
  const updated = update(previous);
  const newAchievements = findNewAchievements(updated);
  const next = unlockAchievements(
    updated,
    newAchievements.map((achievement) => achievement.id)
  );
  writeProgress(next);
  if (newAchievements.length > 0) announceAchievements(newAchievements);
  return { previous, next, newAchievements };
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
      completeLevel: (completion) =>
        commit((state) => applyLevelCompletion(state, completion)),
      recordRun: (run) => {
        commit((state) => recordRun(state, run));
      },
      recordHintOpened: () => {
        commit(recordHintOpened);
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
