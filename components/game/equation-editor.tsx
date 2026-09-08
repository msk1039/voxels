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
  variant?: "default" | "dock";
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
  const docked = variant === "dock";

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onRun();
    }
  }

  return (
    <div className={cn("flex flex-col", docked ? "gap-2" : "gap-4")}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="equation">Equation</Label>
          <span className="text-[11px] text-muted-foreground">⌘/Ctrl + Enter</span>
        </div>
        <Textarea
          id="equation"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "font-mono text-[13px] leading-5",
            docked
              ? "min-h-16 resize-none rounded-[8px] [corner-shape:squircle]"
              : "min-h-32 resize-y [corner-shape:squircle]"
          )}
          spellCheck={false}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <Alert
            variant="destructive"
            className={cn(docked && "rounded-[8px] [corner-shape:squircle]")}
          >
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Equation error</AlertTitle>
            <AlertDescription>
              {error.message} Line {error.line}, column {error.column}.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex gap-2">
          <Button
            className={cn(
              "flex-1",
              docked && "rounded-[8px] [corner-shape:squircle]"
            )}
            onClick={onRun}
            disabled={pending || !value.trim()}
          >
            <Play data-icon="inline-start" aria-hidden="true" />
            {pending ? "Running…" : "Run equation"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(docked && "rounded-[8px] [corner-shape:squircle]")}
            onClick={() => onChange(starterExpression)}
            aria-label="Restore starter equation"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>
      </div>

      {showReference ? <EquationReference /> : null}
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
