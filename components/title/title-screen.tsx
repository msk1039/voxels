"use client";

import Link from "next/link";
import { KeyboardEvent, useMemo } from "react";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Hammer,
  Pencil,
  Play,
  Shuffle,
  Trophy,
  TriangleAlert,
} from "lucide-react";

import { HeaderActions } from "@/components/app/app-header";
import { BlockIcon } from "@/components/blocks/block-icon";
import { CodeField } from "@/components/game/equation-editor";
import { PlayerCard } from "@/components/game/player-hud";
import { useProgress } from "@/components/progress/progress-provider";
import { VoxelCanvas } from "@/components/renderers/voxel-3d/voxel-canvas";
import { CameraPose } from "@/components/renderers/voxel-3d/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { DEFAULT_GRID, getLevelsForMode } from "@/content/levels";
import { SHOWCASE } from "@/content/showcase";
import { useIsDesktop } from "@/hooks/use-desktop";
import { playSfx } from "@/lib/audio/sfx";
import { CellMap } from "@/lib/grid";
import { countCompleted } from "@/lib/progress";
import { cn } from "@/lib/utils";

import { useAttractPlayground } from "./use-attract-playground";

const EMPTY_TARGET: CellMap = new Map();

const SPLASHES = [
  "Now with 40 levels!",
  "x*x + y*y <= r*r!",
  "Blocks all the way down!",
  "Also try the sandbox!",
  "Made of equations!",
  "100% procedural!",
  "abs(x) is your friend!",
  "Mind the modulo!",
];

// The camera looks past the scene so it sits to the right of the menu.
const DESKTOP_CAMERA: CameraPose = {
  position: [12.5, 10, 19.5],
  target: [-3.5, -0.5, 3.5],
};
const MOBILE_CAMERA: CameraPose = {
  position: [18, 12, 18],
  target: [0, -0.5, 0],
};

export function TitleLogo() {
  return (
    <h1 className="relative inline-block font-display text-[44px] leading-none tracking-tight select-none sm:text-[64px]">
      {/* Extruded side of the letters, drawn as a separate layer because a
          text shadow would paint over the clipped gradient fill. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 text-[#3d2616]"
        style={{
          textShadow:
            "0 4px 0 #5c3a20, 0 8px 0 #3d2616, 0 12px 0 rgb(0 0 0 / 0.5)",
        }}
      >
        Voxels
      </span>
      {/* Grass-block letters: green top, darker fringe, dirt below. */}
      <span className="relative block bg-[linear-gradient(#9be86a_0_34%,#62b33c_34%_46%,#b07a4a_46%_100%)] bg-clip-text text-transparent">
        Voxels
      </span>
      <span className="sr-only">: build worlds with equations</span>
    </h1>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  detail,
  variant = "secondary",
}: {
  href: string;
  icon: typeof Play;
  label: string;
  detail?: string;
  variant?: "default" | "secondary" | "gold";
}) {
  return (
    <Link
      href={href}
      onClick={() => playSfx("click")}
      className={cn(
        buttonVariants({ variant, size: "xl" }),
        "w-full justify-start px-4 sm:px-6"
      )}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
      {detail ? (
        <span className="ml-auto font-mono text-xl leading-none opacity-80">{detail}</span>
      ) : null}
    </Link>
  );
}

export function TitleScreen() {
  const desktop = useIsDesktop();
  const { progress } = useProgress();
  const attract = useAttractPlayground(SHOWCASE);
  const cameraPose = desktop ? DESKTOP_CAMERA : MOBILE_CAMERA;
  const splash = SPLASHES[SHOWCASE.indexOf(attract.showcase) % SPLASHES.length];
  const totals = useMemo(
    () => ({
      "2d": getLevelsForMode("2d").length,
      "3d": getLevelsForMode("3d").length,
    }),
    []
  );

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!attract.editing) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void attract.runDraft();
    } else if (event.key === "Escape") {
      attract.resume();
    } else if (event.key.length === 1) {
      playSfx("key");
    }
  }

  return (
    <main className="relative isolate min-h-svh overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <VoxelCanvas
          grid={DEFAULT_GRID}
          target={EMPTY_TARGET}
          actual={attract.cells}
          view="result"
          hasRun
          autoRotate
          transition={attract.transition ?? undefined}
          onTransitionComplete={attract.clearTransition}
          cameraPose={cameraPose}
          camera={cameraPose}
          className="h-full"
        />
        {/* Darken behind the menu so text stays readable over the sky. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(22_21_29/0.88),rgb(22_21_29/0.35)_45%,rgb(22_21_29/0.7))] lg:bg-[linear-gradient(90deg,rgb(22_21_29/0.94),rgb(22_21_29/0.72)_30%,transparent_55%)]" />
      </div>

      <div className="pointer-events-none relative flex min-h-svh flex-col lg:flex-row">
        <div className="pointer-events-auto flex w-full flex-col gap-6 p-5 sm:p-8 lg:w-[30rem] lg:shrink-0">
          <div className="relative pt-4">
            <TitleLogo />
            <p
              key={splash}
              className="absolute top-[4.5rem] left-40 origin-center -rotate-6 animate-pixel-bob font-display text-[9px] whitespace-nowrap text-gold text-shadow-pixel sm:top-[5.75rem] sm:left-64 sm:text-[10px]"
              aria-hidden="true"
            >
              {splash}
            </p>
            <p className="mt-6 text-lg text-foreground/90">
              Write equations. Build worlds out of blocks.
            </p>
          </div>

          <nav className="flex flex-col gap-4" aria-label="Main menu">
            <MenuLink
              href="/play/2d"
              icon={Grid2X2}
              label="Start 2D"
              variant="default"
              detail={`${countCompleted(progress, "2d")}/${totals["2d"]}`}
            />
            <MenuLink
              href="/play/3d"
              icon={Box}
              label="Start 3D"
              variant="default"
              detail={`${countCompleted(progress, "3d")}/${totals["3d"]}`}
            />
            <div className="grid grid-cols-2 gap-4">
              <MenuLink href="/sandbox" icon={Hammer} label="Sandbox" />
              <MenuLink href="/achievements" icon={Trophy} label="Trophies" variant="gold" />
            </div>
          </nav>

          <PlayerCard />
        </div>

        <div className="pointer-events-auto absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
          <HeaderActions />
        </div>

        <div className="pointer-events-none flex min-h-[42svh] flex-1 flex-col p-5 sm:p-8">
          <CommandBar
            attract={attract}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </main>
  );
}

function CommandBar({
  attract,
  onKeyDown,
}: {
  attract: ReturnType<typeof useAttractPlayground>;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const remixHref = `/sandbox?eq=${encodeURIComponent(attract.text)}`;

  return (
    <section
      aria-label="Live playground"
      className="pointer-events-auto mt-auto w-full max-w-2xl self-end pixel-panel p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <BlockIcon material={attract.editing ? 1 : 5} className="size-6" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[9px] text-gold">
            {attract.editing ? "Your build" : "Now building"}
          </div>
          <div className="truncate text-base font-semibold" aria-live="polite">
            {attract.editing ? "Type an equation, press Enter" : attract.showcase.name}
          </div>
        </div>
        <span className="font-mono text-xl leading-none text-muted-foreground tabular-nums">
          {attract.blockCount} blocks
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous showcase"
          onClick={() => attract.skip(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next showcase"
          onClick={() => attract.skip(1)}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <CodeField
        id="playground-equation"
        label="Playground equation"
        value={attract.text}
        invalid={Boolean(attract.error)}
        shakeKey={0}
        readOnly={!attract.editing}
        showCursor={!attract.editing}
        className="h-20"
        onChange={attract.setDraft}
        onKeyDown={onKeyDown}
        onFocus={attract.takeControl}
      />

      {attract.error ? (
        <p className="mt-2 flex items-start gap-2 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {attract.error.message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3">
        {attract.editing ? (
          <>
            <Button onClick={() => void attract.runDraft()} disabled={attract.pending}>
              <Play data-icon="inline-start" aria-hidden="true" />
              Build
            </Button>
            <Button variant="secondary" onClick={attract.resume}>
              <Shuffle data-icon="inline-start" aria-hidden="true" />
              Resume demo
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={attract.takeControl}>
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Edit this equation
          </Button>
        )}
        <Link
          href={remixHref}
          onClick={() => playSfx("click")}
          className={cn(buttonVariants({ variant: "ghost" }), "ml-auto")}
        >
          <Hammer data-icon="inline-start" aria-hidden="true" />
          Remix in sandbox
        </Link>
      </div>
    </section>
  );
}
