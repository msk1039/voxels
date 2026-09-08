"use client";

import { KeyboardEvent } from "react";
import { Play, RotateCcw, TriangleAlert } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  hints?: readonly string[];
  onChange: (value: string) => void;
  onRun: () => void;
  onHintOpened?: () => void;
}

export function EquationEditor({
  value,
  starterExpression,
  error,
  pending,
  hints = [],
  onChange,
  onRun,
  onHintOpened = () => undefined,
}: EquationEditorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onRun();
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
          className="min-h-32 resize-y font-mono text-[13px] leading-5"
          spellCheck={false}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Equation error</AlertTitle>
            <AlertDescription>
              {error.message} Line {error.line}, column {error.column}.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onRun} disabled={pending || !value.trim()}>
            <Play data-icon="inline-start" aria-hidden="true" />
            {pending ? "Running…" : "Run equation"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onChange(starterExpression)}
            aria-label="Restore starter equation"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        </div>
      </div>

      {hints.length > 0 ? (
        <Accordion>
          {hints.map((hint, index) => (
            <AccordionItem
              key={hint}
              value={`hint-${index + 1}`}
              onOpenChange={(open) => {
                if (open) onHintOpened();
              }}
            >
              <AccordionTrigger>Hint {index + 1}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {hint}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}

      <div className="rounded-lg border p-3 text-xs leading-5 text-muted-foreground">
        <div className="mb-1 font-medium text-foreground">Quick reference</div>
        <code>+ - * / %</code> · <code>&lt; &lt;= &gt; &gt;= == !=</code>
        <br />
        <code>&amp;&amp; || !</code> · <code>abs min max sqrt floor</code>
        <br />
        Return <code>true</code> for the default material, <code>0</code> for
        empty, or <code>1–8</code> for a color.
      </div>
    </div>
  );
}
