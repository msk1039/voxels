"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

import { BlockIcon } from "@/components/blocks/block-icon";
import { SettingsDialog } from "@/components/app/settings-dialog";
import { SoundToggle } from "@/components/app/sound-toggle";
import { PlayerHud } from "@/components/game/player-hud";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/play/2d", label: "2D World" },
  { href: "/play/3d", label: "3D World" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/achievements", label: "Trophies" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <BlockIcon material={4} className="size-7" title="Voxels home" />
      <span className="font-display text-xs tracking-wide text-foreground text-shadow-pixel">
        Voxels
      </span>
    </Link>
  );
}

export function HeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <SoundToggle />
      <SettingsDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label="Open settings">
            <Settings aria-hidden="true" />
          </Button>
        }
      />
    </div>
  );
}

function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("items-center gap-1", className)} aria-label="Primary navigation">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
              "shrink-0"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppHeader() {
  return (
    <header className="border-b-[3px] border-border bg-card/90">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Logo />
        <NavLinks className="hidden md:flex" />
        <div className="ml-auto flex items-center gap-3">
          <PlayerHud />
          <HeaderActions />
        </div>
      </div>
      <NavLinks className="flex overflow-x-auto px-3 pb-3 md:hidden" />
    </header>
  );
}
