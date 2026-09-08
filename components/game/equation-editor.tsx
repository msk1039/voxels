"use client";

import { KeyboardEvent } from "react";
import { Play, RotateCcw, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface EditorError {
  message: string;
  line: number;
  column: number;
}

interface EquationEditorProps {
  value: string;
  starterExpression: string;
  error: EditorError | null;
  pending: boolean;
  variant?: "default" | "pane";
  showReference?: boolean;
  onChange: (value: string) => void;
  onRun: () => void;
}

export function EquationEditor({
  value,
  starterExpression,
  error,
  pending,
  variant = "default",
  showReference = true,
  onChange,
  onRun,
}: EquationEditorProps) {
  const pane = variant === "pane";

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onRun();
    }
  }

  return (
    <div className={cn("flex flex-col", pane ? "h-full min-h-0" : "gap-2")}>
      <div
        className={cn(
          "flex items-center justify-between",
          pane && "h-10 shrink-0 border-b px-3"
        )}
      >
        <Label htmlFor="equation">Equation</Label>
        <span className="text-[11px] text-muted-foreground">⌘/Ctrl + Enter</span>
      </div>
      <div
        className={cn(
          pane ? "flex min-h-0 flex-1 flex-col gap-2 p-3" : "space-y-2"
        )}
      >
        <Textarea
          id="equation"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "font-mono text-[13px] leading-5",
            pane
              ? "min-h-0 flex-1 resize-none rounded-[10px] bg-muted/20 p-3 [corner-shape:squircle]"
              : "min-h-32 resize-y [corner-shape:squircle]"
          )}
          spellCheck={false}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <Alert
            variant="destructive"
            className={cn(pane && "rounded-[10px] [corner-shape:squircle]")}
          >
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Equation error</AlertTitle>
            <AlertDescription>
              {error.message} Line {error.line}, column {error.column}.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className={cn("flex gap-2", pane && "shrink-0 justify-end")}>
          <Button
            className={cn(
              !pane && "flex-1",
              pane && "min-w-28 rounded-[10px] [corner-shape:squircle]"
            )}
            onClick={onRun}
            disabled={pending || !value.trim()}
          >
            <Play data-icon="inline-start" aria-hidden="true" />
            {pending
              ? pane
                ? "Simulating…"
                : "Running…"
              : pane
                ? "Simulate"
                : "Run equation"}
          </Button>
          {pane ? (
            <Button
              variant="outline"
              className="rounded-[10px] [corner-shape:squircle]"
              onClick={() => onChange(starterExpression)}
            >
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Reset
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onChange(starterExpression)}
              aria-label="Restore starter equation"
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {!pane && showReference ? <EquationReference /> : null}
    </div>
  );
}

export function EquationReference() {
  return (
    <div className="rounded-lg border p-3 text-xs leading-5 text-muted-foreground">
      <div className="mb-1 font-medium text-foreground">Quick reference</div>
      <code>+ - * / %</code> · <code>&lt; &lt;= &gt; &gt;= == !=</code>
      <br />
      <code>&amp;&amp; || !</code> · <code>abs min max sqrt floor</code>
      <br />
      Return <code>true</code> for the default material, <code>0</code> for
      empty, or <code>1–8</code> for a color.
    </div>
  );
}
