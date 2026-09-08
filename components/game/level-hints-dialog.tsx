"use client";

import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LevelHintsDialogProps {
  hints: readonly string[];
  onOpen: () => void;
}

export function LevelHintsDialog({ hints, onOpen }: LevelHintsDialogProps) {
  if (hints.length === 0) return null;

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) onOpen();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Lightbulb data-icon="inline-start" aria-hidden="true" />
        Hints
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Level hints</DialogTitle>
          <DialogDescription>
            Use these clues when you need help shaping the equation.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {hints.map((hint, index) => (
            <li key={hint} className="rounded-lg border p-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Hint {index + 1}
              </div>
              <p className="leading-6">{hint}</p>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
