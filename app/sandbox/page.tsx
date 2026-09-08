import { AppHeader } from "@/components/app/app-header";
import { SandboxWorkspace } from "@/components/sandbox/sandbox-workspace";

export default function SandboxPage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <SandboxWorkspace />
      </main>
    </div>
  );
}
