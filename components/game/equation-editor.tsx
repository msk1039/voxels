"use client";

import { KeyboardEvent, UIEvent, useEffect, useMemo, useRef } from "react";
import { Play, RotateCcw, TriangleAlert } from "lucide-react";

import { BlockIcon } from "@/components/blocks/block-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BLOCKS } from "@/lib/blocks";
import { HighlightKind, highlightEquation } from "@/lib/equation";
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
  /** Changing this number replays the shake animation. */
  shakeKey?: number;
  onChange: (value: string) => void;
  onRun: () => void;
}

const HIGHLIGHT_CLASSES: Record<HighlightKind, string> = {
  comment: "text-muted-foreground",
  number: "text-gold",
  variable: "text-diamond",
  function: "text-[#c69cf0]",
  keyword: "text-[#ff8f6b]",
  operator: "text-[#f28fb0]",
  punctuation: "text-foreground/70",
  text: "text-foreground",
};

export function EquationEditor({
  value,
  starterExpression,
  error,
  pending,
  variant = "default",
  showReference = true,
  shakeKey = 0,
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
    <div className={cn("flex flex-col", pane ? "h-full min-h-0" : "gap-3")}>
      <div
        className={cn(
          "flex items-center justify-between",
          pane && "h-11 shrink-0 border-b-[3px] border-border bg-black/20 px-3"
        )}
      >
        <Label
          htmlFor="equation"
          className="font-display text-[10px] tracking-wider text-gold text-shadow-pixel"
        >
          Equation
        </Label>
        <kbd className="bg-black/40 px-1.5 font-mono text-base leading-5 text-muted-foreground">
          ⌘/Ctrl + ↵
        </kbd>
      </div>
      <div
        className={cn(
          pane ? "flex min-h-0 flex-1 flex-col gap-3 p-3" : "space-y-3"
        )}
      >
        <CodeField
          value={value}
          invalid={Boolean(error)}
          shakeKey={shakeKey}
          className={pane ? "min-h-0 flex-1" : "min-h-32"}
          onChange={onChange}
          onKeyDown={handleKeyDown}
        />
        {error ? (
          <Alert variant="destructive" className="bg-destructive/15">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Equation error</AlertTitle>
            <AlertDescription>
              {error.message} Line {error.line}, column {error.column}.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className={cn("flex gap-3", pane && "shrink-0 justify-end")}>
          <Button
            size={pane ? "default" : "lg"}
            className={cn(!pane && "flex-1", pane && "min-w-28")}
            onClick={onRun}
            disabled={pending || !value.trim()}
          >
            <Play data-icon="inline-start" aria-hidden="true" />
            {pending ? "Building…" : pane ? "Run" : "Run equation"}
          </Button>
          {pane ? (
            <Button
              variant="secondary"
              onClick={() => onChange(starterExpression)}
            >
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Reset
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon-lg"
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

interface CodeFieldProps {
  id?: string;
  value: string;
  invalid: boolean;
  shakeKey: number;
  readOnly?: boolean;
  /** Draws a blinking block cursor after the text, for typed-out demos. */
  showCursor?: boolean;
  label?: string;
  className?: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
}

/**
 * A textarea with transparent text over a highlighted <pre>. Both share the
 * same font, padding and wrapping so every glyph lines up.
 */
export function CodeField({
  id = "equation",
  value,
  invalid,
  shakeKey,
  readOnly = false,
  showCursor = false,
  label,
  className,
  onChange,
  onKeyDown,
  onFocus,
}: CodeFieldProps) {
  const frame = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (shakeKey === 0 || !frame.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    frame.current.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(-4px, 0)" },
        { transform: "translate(4px, -2px)" },
        { transform: "translate(-2px, 2px)" },
        { transform: "translate(2px, 0)" },
        { transform: "translate(0, 0)" },
      ],
      { duration: 320, easing: "steps(5)" }
    );
  }, [shakeKey]);
  const segments = useMemo(() => highlightEquation(value), [value]);
  const shared =
    "m-0 px-3 py-2 font-mono text-[22px] leading-6 whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (!overlay.current) return;
    overlay.current.scrollTop = event.currentTarget.scrollTop;
    overlay.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <div
      ref={frame}
      className={cn(
        "relative flex pixel-well",
        invalid && "[--border:var(--destructive)]",
        className
      )}
    >
      <pre
        ref={overlay}
        aria-hidden="true"
        className={cn(shared, "pointer-events-none absolute inset-0 overflow-hidden")}
      >
        {segments.map((segment, index) => (
          <span key={index} className={HIGHLIGHT_CLASSES[segment.kind]}>
            {segment.text}
          </span>
        ))}
        {showCursor ? (
          <span className="animate-pixel-blink bg-gold text-transparent">_</span>
        ) : null}
        {/* A trailing newline needs a glyph after it to take up height. */}
        {"\u200b"}
      </pre>
      <textarea
        id={id}
        value={value}
        readOnly={readOnly}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-invalid={invalid}
        className={cn(
          shared,
          "relative min-h-0 w-full flex-1 resize-none bg-transparent text-transparent caret-gold outline-none selection:bg-gold/40 selection:text-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        )}
      />
    </div>
  );
}

export function EquationReference() {
  return (
    <div className="pixel-panel space-y-2 p-3 text-sm leading-5 text-muted-foreground">
      <div className="font-display text-[10px] text-gold text-shadow-pixel">
        Quick reference
      </div>
      <p className="font-mono text-lg leading-5 text-foreground">
        + - * / % · &lt; &lt;= &gt; &gt;= == != · &amp;&amp; || ! · a ? b : c
        <br />
        abs min max sqrt floor ceil round pow
      </p>
      <p>
        Return <code className="font-mono text-lg text-gold">true</code> for
        a default block, <code className="font-mono text-lg text-gold">0</code>{" "}
        for air, or a block number:
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {BLOCKS.map((block) => (
          <li key={block.material} className="flex items-center gap-2">
            <BlockIcon material={block.material} className="size-5" />
            <span className="font-mono text-lg leading-none text-gold">
              {block.material}
            </span>
            <span className="truncate text-foreground">{block.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
