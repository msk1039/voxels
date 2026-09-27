import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { WorldMap } from "@/components/map/world-map";
import { WORLD_NAMES } from "@/content/levels";

interface WorldPageProps {
  params: Promise<{ mode: string }>;
}

export function generateStaticParams() {
  return [{ mode: "2d" }, { mode: "3d" }];
}

export async function generateMetadata({ params }: WorldPageProps): Promise<Metadata> {
  const { mode } = await params;
  return { title: mode === "3d" ? WORLD_NAMES["3d"] : WORLD_NAMES["2d"] };
}

export default async function WorldPage({ params }: WorldPageProps) {
  const { mode } = await params;
  if (mode !== "2d" && mode !== "3d") notFound();

  return (
    <div className="min-h-svh">
      <AppHeader />
      <main>
        <WorldMap mode={mode} />
      </main>
    </div>
  );
}
