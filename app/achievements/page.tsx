import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { TrophyRoom } from "@/components/game/trophy-room";

export const metadata: Metadata = { title: "Trophies" };

export default function AchievementsPage() {
  return (
    <div className="min-h-svh">
      <AppHeader />
      <main>
        <TrophyRoom />
      </main>
    </div>
  );
}
