"use client";

import { ReactElement, useState } from "react";
import { RotateCcw } from "lucide-react";

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
import { FrameRate, GraphicsQuality, RenderScale } from "@/lib/settings";

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
  } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");

  function handleReset() {
    resetProgress();
    setConfirmOpen(false);
    setMessage("Level progress was reset.");
  }

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Change local game settings and manage campaign progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium">Graphics quality</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Auto uses full desktop effects and reduces them on smaller or
              slower devices.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium">Level progress</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Clear completed levels, earned blocks, and best level equations.
              Sandbox drafts and graphics settings stay unchanged.
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
                    This clears completed levels, earned blocks, best scores, and
                    saved level equations from this browser. Sandbox drafts and
                    settings stay unchanged.
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
          <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
            {message}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
