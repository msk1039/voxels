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
import { GraphicsQuality } from "@/lib/settings";

interface SettingsDialogProps {
  trigger: ReactElement;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const { resetProgress } = useProgress();
  const { settings, setGraphicsQuality } = useSettings();
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
            <Select
              value={settings.graphicsQuality}
              onValueChange={(value) =>
                setGraphicsQuality(value as GraphicsQuality)
              }
            >
              <SelectTrigger className="mt-3 w-40" aria-label="Graphics quality">
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
