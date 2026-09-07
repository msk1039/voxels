import Link from "next/link";
import { Box, Settings } from "lucide-react";

import { SettingsDialog } from "@/components/app/settings-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function AppHeader() {
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
        <SettingsDialog
          trigger={
            <span className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <Settings aria-hidden="true" />
              <span className="sr-only">Open settings</span>
            </span>
          }
        />
      </div>
    </header>
  );
}
