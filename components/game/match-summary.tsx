import { Check, CircleDashed, CircleMinus, CirclePlus, Paintbrush } from "lucide-react";

import { MatchResult } from "@/lib/grid";

interface MatchSummaryProps {
  match: MatchResult;
  hasRun: boolean;
}

const items = [
  { key: "correct", label: "Correct", icon: Check, color: "text-emerald-700" },
  { key: "missing", label: "Missing", icon: CircleMinus, color: "text-blue-700" },
  { key: "extra", label: "Extra", icon: CirclePlus, color: "text-red-700" },
  {
    key: "wrongMaterial",
    label: "Wrong color",
    icon: Paintbrush,
    color: "text-violet-700",
  },
] as const;

export function MatchSummary({ match, hasRun }: MatchSummaryProps) {
  if (!hasRun) {
    return (
      <div className="flex items-center gap-2 rounded-[6px] border px-3 py-2 text-xs text-muted-foreground [corner-shape:squircle]">
        <CircleDashed className="size-4" aria-hidden="true" />
        Run the equation to compare your result.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2" aria-label="Match summary">
      {items.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="flex items-center gap-2 rounded-[6px] border px-2.5 py-2 [corner-shape:squircle]"
        >
          <Icon className={`size-3.5 ${color}`} aria-hidden="true" />
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="ml-auto text-xs font-medium tabular-nums">
            {match[key].length}
          </span>
        </div>
      ))}
    </div>
  );
}
