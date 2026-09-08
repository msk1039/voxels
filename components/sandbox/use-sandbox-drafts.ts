"use client";

import { useCallback, useSyncExternalStore } from "react";

import { EquationMode } from "@/lib/equation";
import { SANDBOX_STORAGE_KEY } from "@/lib/progress";
import {
  DEFAULT_SANDBOX_DRAFTS,
  SandboxDrafts,
  loadSandboxDrafts,
  saveSandboxDrafts,
} from "@/lib/sandbox";

const listeners = new Set<() => void>();
let cachedDrafts: SandboxDrafts = DEFAULT_SANDBOX_DRAFTS;
let loaded = false;

function emitChange() {
  for (const listener of listeners) listener();
}

function readBrowserDrafts() {
  if (!loaded && typeof window !== "undefined") {
    cachedDrafts = loadSandboxDrafts(window.localStorage);
    loaded = true;
  }
  return cachedDrafts;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SANDBOX_STORAGE_KEY) {
      cachedDrafts = loadSandboxDrafts(window.localStorage);
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

export function useSandboxDrafts() {
  const drafts = useSyncExternalStore(
    subscribe,
    readBrowserDrafts,
    () => DEFAULT_SANDBOX_DRAFTS
  );

  const setSource = useCallback((mode: EquationMode, source: string) => {
    const next: SandboxDrafts = {
      schemaVersion: 1,
      sources: { ...readBrowserDrafts().sources, [mode]: source },
    };
    cachedDrafts = next;
    loaded = true;
    saveSandboxDrafts(window.localStorage, next);
    emitChange();
  }, []);

  return { drafts, setSource };
}
