"use client";

import Link from "next/link";
import { Box, Grid2X2, MoveRight } from "lucide-react";

import { useProgress } from "@/components/progress/progress-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { countCompleted, getContinueLevel } from "@/lib/progress";
import { cn } from "@/lib/utils";

const tracks = [
  {
    mode: "2d" as const,
    title: "Plane Lab",
    description: "Learn the coordinate grid by building shapes with x and y.",
    icon: Grid2X2,
  },
  {
    mode: "3d" as const,
    title: "Volume Lab",
    description: "Add z and turn equations into three-dimensional voxel models.",
    icon: Box,
  },
];

export function HomeTracks() {
  const { progress } = useProgress();

  return (
    <section className="grid gap-4 md:grid-cols-2" aria-label="Game tracks">
      {tracks.map((track) => {
        const Icon = track.icon;
        const completed = countCompleted(progress, track.mode);
        const next = getContinueLevel(track.mode, progress);
        return (
          <Card key={track.mode}>
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <CardTitle>{track.title}</CardTitle>
              <CardDescription>{track.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completed} of 12 complete</span>
                <span>{Math.round((completed / 12) * 100)}%</span>
              </div>
              <Progress value={(completed / 12) * 100} />
            </CardContent>
            <CardFooter>
              <Link
                href={`/play/${track.mode}/${next.id}`}
                className={cn(buttonVariants(), "ml-auto")}
              >
                {completed === 0 ? "Start" : "Continue"} {track.title}
                <MoveRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </section>
  );
}
