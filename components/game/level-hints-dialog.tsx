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
      <DialogTrigger
        render={
          <Button variant="gold" size="sm" />
        }
      >
        <Lightbulb data-icon="inline-start" aria-hidden="true" />
        Hints
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Level hints</DialogTitle>
          <DialogDescription>
            Peeking at hints costs this level&apos;s no-hint block.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {hints.map((hint, index) => (
            <li key={hint} className="bg-black/30 p-3 [--pixel:2px] pixel-border">
              <div className="mb-1 font-display text-[10px] text-gold">
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
