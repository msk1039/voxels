"use client";

import Link from "next/link";
import { Box, Cuboid, Settings } from "lucide-react";

import { SettingsDialog } from "@/components/app/settings-dialog";
import { useProgress } from "@/components/progress/progress-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { countEarnedBlocks } from "@/lib/progress";

export function AppHeader() {
  const { progress } = useProgress();
  const earnedBlocks = countEarnedBlocks(progress);

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-medium">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Box className="size-4" aria-hidden="true" />
        </span>
        Voxels
      </Link>
      <Separator orientation="vertical" className="mx-4 h-5" />
      <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
        <Link href="/play/2d/origin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Plane Lab
        </Link>
        <Link href="/play/3d/slice" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Volume Lab
        </Link>
        <Link href="/sandbox" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Sandbox
        </Link>
      </nav>
      <div className="ml-auto">
        <Badge variant="outline" className="mr-2 hidden sm:inline-flex">
          <Cuboid aria-hidden="true" />
          {earnedBlocks} / 72
        </Badge>
        <SettingsDialog
          trigger={
            <Button variant="ghost" size="icon">
              <Settings aria-hidden="true" />
              <span className="sr-only">Open settings</span>
            </Button>
          }
        />
      </div>
    </header>
  );
}
