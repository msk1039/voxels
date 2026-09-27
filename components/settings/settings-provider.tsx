"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { setSfxOptions } from "@/lib/audio/sfx";
import { SETTINGS_STORAGE_KEY } from "@/lib/progress";
import {
  DEFAULT_SETTINGS,
  FrameRate,
  GraphicsQuality,
  PixelSize,
  RenderScale,
  SettingsState,
  loadSettings,
  saveSettings,
} from "@/lib/settings";

interface SettingsContextValue {
  settings: SettingsState;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setRenderScale: (scale: RenderScale) => void;
  setFrameRate: (rate: FrameRate) => void;
  setPixelSize: (size: PixelSize) => void;
  setSound: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const listeners = new Set<() => void>();
let cachedSettings: SettingsState = DEFAULT_SETTINGS;
let loaded = false;

function emitChange() {
  for (const listener of listeners) listener();
}

function readBrowserSettings() {
  if (!loaded && typeof window !== "undefined") {
    cachedSettings = loadSettings(window.localStorage);
    loaded = true;
  }
  return cachedSettings;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SETTINGS_STORAGE_KEY) {
      cachedSettings = loadSettings(window.localStorage);
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

function writeSettings(settings: SettingsState) {
  cachedSettings = settings;
  loaded = true;
  saveSettings(window.localStorage, settings);
  emitChange();
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    subscribe,
    readBrowserSettings,
    () => DEFAULT_SETTINGS
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setGraphicsQuality: (graphicsQuality) => {
        writeSettings({ ...readBrowserSettings(), graphicsQuality });
      },
      setRenderScale: (renderScale) => {
        writeSettings({ ...readBrowserSettings(), renderScale });
      },
      setFrameRate: (frameRate) => {
        writeSettings({ ...readBrowserSettings(), frameRate });
      },
      setPixelSize: (pixelSize) => {
        writeSettings({ ...readBrowserSettings(), pixelSize });
      },
      setSound: (sound) => {
        writeSettings({ ...readBrowserSettings(), sound });
      },
      setVolume: (volume) => {
        writeSettings({
          ...readBrowserSettings(),
          volume: Math.min(1, Math.max(0, volume)),
        });
      },
    }),
    [settings]
  );

  useEffect(() => {
    setSfxOptions({ enabled: settings.sound, volume: settings.volume });
  }, [settings.sound, settings.volume]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider.");
  }
  return context;
}
