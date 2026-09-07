import Link from "next/link";
import { Box, Grid2X2, MoveRight } from "lucide-react";

import { AppHeader } from "@/components/app/app-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tracks = [
  {
    title: "Plane Lab",
    description: "Learn the coordinate grid by building shapes with x and y.",
    href: "/play/2d/origin",
    count: "12 levels",
    icon: Grid2X2,
  },
  {
    title: "Volume Lab",
    description: "Add z and turn equations into three-dimensional voxel models.",
    href: "/play/3d/slice",
    count: "12 levels",
    icon: Box,
  },
];

export default function Home() {
  return (
    <div className="min-h-svh bg-muted/30">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <section className="max-w-2xl space-y-3">
          <Badge variant="outline">Local progress only</Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Build shapes with equations.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Match each target by describing its cells. Start on a flat grid or
            move directly into three dimensions.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Game tracks">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <Card key={track.href}>
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardTitle>{track.title}</CardTitle>
                  <CardDescription>{track.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">{track.count}</span>
                </CardContent>
                <CardFooter>
                  <Link href={track.href} className={cn(buttonVariants(), "ml-auto")}>
                    Start {track.title}
                    <MoveRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </section>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Sandbox</CardTitle>
            <CardDescription>
              Experiment without a target or campaign score.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/sandbox"
              className={cn(buttonVariants({ variant: "outline" }), "ml-auto")}
            >
              Open Sandbox
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
