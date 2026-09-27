import type { Metadata } from "next";

import { AppHeader } from "@/components/app/app-header";
import { SandboxWorkspace } from "@/components/sandbox/sandbox-workspace";

export const metadata: Metadata = { title: "Sandbox" };

interface SandboxPageProps {
  searchParams: Promise<{ eq?: string | string[] }>;
}

export default async function SandboxPage({ searchParams }: SandboxPageProps) {
  const { eq } = await searchParams;
  // "Remix in sandbox" on the title screen links here with ?eq=…
  const remix = typeof eq === "string" ? eq.slice(0, 2000) : undefined;

  return (
    <div className="min-h-svh">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <SandboxWorkspace remixEquation={remix} />
      </main>
    </div>
  );
}
