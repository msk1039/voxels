import { EquationMode } from "@/lib/equation";

export interface SandboxDrafts {
  schemaVersion: 1;
  sources: Record<EquationMode, string>;
}
