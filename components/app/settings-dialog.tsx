"use client";

import { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
  trigger: ReactElement;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Progress and graphics controls will live here.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border p-3">
          <div className="text-sm font-medium">Level progress</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Reset becomes available after campaign progress is connected.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled>
            Reset level progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
