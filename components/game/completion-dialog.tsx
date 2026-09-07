"use client";

import Link from "next/link";
import { Box, Check, Lightbulb, Sparkles } from "lucide-react";

import { LevelDefinition } from "@/content/levels";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CompletionDialogProps {
  level: LevelDefinition;
  open: boolean;
  usedHint: boolean;
  complexity: number;
  nextHref?: string;
  onOpenChange: (open: boolean) => void;
}

export function CompletionDialog({
  level,
  open,
  usedHint,
  complexity,
  nextHref,
  onOpenChange,
}: CompletionDialogProps) {
  const blocks = [
    { label: "Complete", earned: true, icon: Check },
    { label: "No hints", earned: !usedHint, icon: Lightbulb },
    {
      label: `Efficient (≤ ${level.efficientCost})`,
      earned: complexity <= level.efficientCost,
      icon: Sparkles,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
            <Box className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Level complete</DialogTitle>
          <DialogDescription>
            Your equation matches {level.title} exactly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {blocks.map(({ label, earned, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Icon className="size-4" aria-hidden="true" />
              <span className="text-sm">{label}</span>
              <Badge className="ml-auto" variant={earned ? "default" : "outline"}>
                {earned ? "Earned" : "Try again"}
              </Badge>
            </div>
          ))}
        </div>
        <DialogFooter>
          {nextHref ? (
            <Link href={nextHref} className={cn(buttonVariants(), "w-full sm:w-auto")}>
              Next level
            </Link>
          ) : (
            <Link href="/" className={cn(buttonVariants(), "w-full sm:w-auto")}>
              Back to tracks
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
