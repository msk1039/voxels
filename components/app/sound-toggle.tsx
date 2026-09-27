"use client";

import { Volume2, VolumeX } from "lucide-react";

import { useSettings } from "@/components/settings/settings-provider";
import { Button } from "@/components/ui/button";
import { playSfx, setSfxOptions } from "@/lib/audio/sfx";

export function SoundToggle() {
  const { settings, setSound } = useSettings();
  const label = settings.sound ? "Mute sound" : "Unmute sound";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={!settings.sound}
      onClick={() => {
        const next = !settings.sound;
        setSound(next);
        if (next) {
          // Apply now so the confirmation blip plays before the effect syncs.
          setSfxOptions({ enabled: true, volume: settings.volume });
          playSfx("click");
        }
      }}
    >
      {settings.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </Button>
  );
}
