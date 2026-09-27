"use client";

import { ReactElement, useState } from "react";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";

import { useProgress } from "@/components/progress/progress-provider";
import { useSettings } from "@/components/settings/settings-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { playSfx } from "@/lib/audio/sfx";
import { FrameRate, GraphicsQuality, PixelSize, RenderScale } from "@/lib/settings";

interface SettingsDialogProps {
  trigger: ReactElement;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const { resetProgress } = useProgress();
  const {
    settings,
    setGraphicsQuality,
    setRenderScale,
    setFrameRate,
    setPixelSize,
    setSound,
    setVolume,
  } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");

  function handleReset() {
    resetProgress();
    setConfirmOpen(false);
    setMessage("Progress was reset.");
  }

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Graphics, sound and saved progress for this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-black/25 p-3 [--pixel:2px] pixel-border">
            <div className="font-display text-[10px] text-gold">Graphics</div>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Auto adds shadows on desktop and drops them on smaller or slower
              devices. Pixel size renders the world chunkier, which is also
              faster.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="graphics-quality">Effects</Label>
                <Select
                  value={settings.graphicsQuality}
                  onValueChange={(value) =>
                    setGraphicsQuality(value as GraphicsQuality)
                  }
                >
                  <SelectTrigger id="graphics-quality" className="w-full">
                    <SelectValue>
                      {(value) =>
                        value === "high"
                          ? "High"
                          : value === "reduced"
                            ? "Reduced"
                            : "Auto"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="reduced">Reduced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="render-scale">Resolution</Label>
                <Select
                  value={settings.renderScale}
                  onValueChange={(value) =>
                    setRenderScale(value as RenderScale)
                  }
                >
                  <SelectTrigger id="render-scale" className="w-full">
                    <SelectValue>
                      {(value) =>
                        value === "full"
                          ? "100%"
                          : value === "balanced"
                            ? "80%"
                            : value === "performance"
                              ? "65%"
                              : "Auto"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="full">100%</SelectItem>
                    <SelectItem value="balanced">80%</SelectItem>
                    <SelectItem value="performance">65%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="frame-rate">Frame rate</Label>
                <Select
                  value={settings.frameRate}
                  onValueChange={(value) => setFrameRate(value as FrameRate)}
                >
                  <SelectTrigger id="frame-rate" className="w-full">
                    <SelectValue>
                      {(value) =>
                        value === "60" ? "60 FPS" : value === "30" ? "30 FPS" : "Auto"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pixel-size">Pixel size</Label>
                <Select
                  value={settings.pixelSize}
                  onValueChange={(value) => setPixelSize(value as PixelSize)}
                >
                  <SelectTrigger id="pixel-size" className="w-full">
                    <SelectValue>
                      {(value) => (value === "off" ? "Sharp" : `${value}× retro`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Sharp</SelectItem>
                    <SelectItem value="2">2× retro</SelectItem>
                    <SelectItem value="3">3× retro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-black/25 p-3 [--pixel:2px] pixel-border">
            <div className="font-display text-[10px] text-gold">Sound</div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant={settings.sound ? "default" : "secondary"}
                size="sm"
                aria-pressed={settings.sound}
                onClick={() => setSound(!settings.sound)}
              >
                {settings.sound ? (
                  <Volume2 data-icon="inline-start" aria-hidden="true" />
                ) : (
                  <VolumeX data-icon="inline-start" aria-hidden="true" />
                )}
                {settings.sound ? "On" : "Off"}
              </Button>
              <Label htmlFor="volume" className="sr-only">
                Volume
              </Label>
              <input
                id="volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.volume * 100)}
                disabled={!settings.sound}
                onChange={(event) => setVolume(Number(event.target.value) / 100)}
                onPointerUp={() => playSfx("block")}
                className="h-3 flex-1 cursor-pointer accent-gold disabled:opacity-40"
              />
              <span className="w-10 text-right font-mono text-lg tabular-nums">
                {Math.round(settings.volume * 100)}
              </span>
            </div>
          </div>

          <div className="bg-black/25 p-3 [--pixel:2px] pixel-border">
            <div className="font-display text-[10px] text-gold">Progress</div>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Erase cleared levels, earned blocks, XP, trophies and best
              equations. Sandbox drafts and settings stay unchanged.
            </p>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm" className="mt-3" />
                }
              >
                <RotateCcw data-icon="inline-start" aria-hidden="true" />
                Reset level progress
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all level progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This erases cleared levels, earned blocks, XP, trophies, best
                    scores and saved level equations from this browser. Sandbox
                    drafts and settings stay unchanged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleReset}>
                    Reset progress
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
            {message}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
