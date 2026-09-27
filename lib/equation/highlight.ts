export type HighlightKind =
  | "comment"
  | "number"
  | "variable"
  | "function"
  | "keyword"
  | "operator"
  | "punctuation"
  | "text";

export interface HighlightSegment {
  kind: HighlightKind;
  text: string;
}

const VARIABLES = new Set(["x", "y", "z"]);
const KEYWORDS = new Set(["true", "false"]);
const PATTERN =
  /(\/\/[^\n]*)|(\d+(?:\.\d*)?|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(<=|>=|==|!=|&&|\|\||[+\-*/%<>!?:])|([(),])/g;

/**
 * Splits source into coloured segments for the editor overlay. Unlike
 * `tokenize` it never throws and keeps every character, including
 * whitespace, so the overlay lines up with the textarea exactly.
 */
export function highlightEquation(source: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let last = 0;
  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ kind: "text", text: source.slice(last, index) });
    const [text, comment, number, identifier, operator] = match;
    let kind: HighlightKind = "punctuation";
    if (comment) kind = "comment";
    else if (number) kind = "number";
    else if (identifier) {
      if (VARIABLES.has(identifier)) kind = "variable";
      else if (KEYWORDS.has(identifier)) kind = "keyword";
      else kind = "function";
    } else if (operator) kind = "operator";
    segments.push({ kind, text });
    last = index + text.length;
  }
  if (last < source.length) segments.push({ kind: "text", text: source.slice(last) });
  return segments;
}
