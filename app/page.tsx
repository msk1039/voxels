import Link from "next/link";

import { AppHeader } from "@/components/app/app-header";
import { HomeTracks } from "@/components/app/home-tracks";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

        <HomeTracks />

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
