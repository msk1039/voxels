import { CircleDashed, CircleMinus, CirclePlus, Paintbrush } from "lucide-react";

import { MatchResult } from "@/lib/grid";

interface MatchSummaryProps {
  match: MatchResult;
  hasRun: boolean;
}

const items = [
  { key: "missing", label: "Missing", icon: CircleMinus, color: "text-[#8fc3ff]" },
  { key: "extra", label: "Extra", icon: CirclePlus, color: "text-[#ff8a8f]" },
  {
    key: "wrongMaterial",
    label: "Wrong block",
    icon: Paintbrush,
    color: "text-[#c9a4ea]",
  },
] as const;

export function MatchSummary({ match, hasRun }: MatchSummaryProps) {
  if (!hasRun) {
    return (
      <div className="flex items-center gap-2 bg-black/30 px-3 py-2 text-sm text-muted-foreground [--pixel:2px] pixel-border">
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
          className="flex items-center gap-2 bg-black/30 px-2.5 py-2 [--pixel:2px] pixel-border"
        >
          <Icon className={`size-3.5 ${color}`} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="ml-auto font-mono text-xl leading-none tabular-nums">
            {match[key].length}
          </span>
        </div>
      ))}
    </div>
  );
}
