"use client";

import Link from "next/link";
import { Box, CheckCircle2, Circle, Grid2X2 } from "lucide-react";

import { SettingsDialog } from "@/components/app/settings-dialog";
import { useProgress } from "@/components/progress/progress-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { getLevelsForMode } from "@/content/levels";
import { countCompleted, levelProgressKey } from "@/lib/progress";

interface GameScaffoldProps {
  mode: "2d" | "3d";
  levelId: string;
  children: React.ReactNode;
}

export function GameScaffold({ mode, levelId, children }: GameScaffoldProps) {
  const { progress } = useProgress();
  const Icon = mode === "2d" ? Grid2X2 : Box;
  const trackName = mode === "2d" ? "Plane Lab" : "Volume Lab";
  const levels = getLevelsForMode(mode);
  const completed = countCompleted(progress, mode);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-3">
          <Link href="/" className="flex h-8 items-center gap-2 px-2 font-medium">
            <Icon className="size-4" aria-hidden="true" />
            {trackName}
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Levels</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {levels.map((level) => {
                  const levelProgress =
                    progress.levels[levelProgressKey(mode, level.id)];
                  return (
                    <SidebarMenuItem key={level.id}>
                      <SidebarMenuButton
                        render={<Link href={`/play/${mode}/${level.id}`} />}
                        isActive={levelId === level.id}
                      >
                        {levelProgress?.completed ? (
                          <CheckCircle2 aria-hidden="true" />
                        ) : (
                          <Circle className="size-2.5" aria-hidden="true" />
                        )}
                        <span>{level.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-3 text-xs text-muted-foreground">
          Progress stays in this browser.
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-muted/20">
        <header className="flex h-14 shrink-0 items-center border-b bg-background px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-3 h-5" />
          <span className="text-sm font-medium">{trackName}</span>
          <Badge variant="outline" className="ml-3 hidden sm:inline-flex">
            {completed} / {levels.length}
          </Badge>
          <nav className="ml-4 hidden items-center gap-1 sm:flex" aria-label="Game modes">
            <Link
              href="/play/2d/origin"
              className={cn(buttonVariants({ variant: mode === "2d" ? "secondary" : "ghost", size: "sm" }))}
            >
              2D
            </Link>
            <Link
              href="/play/3d/slice"
              className={cn(buttonVariants({ variant: mode === "3d" ? "secondary" : "ghost", size: "sm" }))}
            >
              3D
            </Link>
            <Link href="/sandbox" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sandbox
            </Link>
          </nav>
          <div className="ml-auto">
            <SettingsDialog
              trigger={
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              }
            />
          </div>
        </header>
        <main className="min-h-0 flex-1 p-3 sm:p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
