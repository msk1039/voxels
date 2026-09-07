import { EquationError } from "./error";

export type TokenKind =
  | "number"
  | "identifier"
  | "operator"
  | "leftParen"
  | "rightParen"
  | "comma"
  | "question"
  | "colon"
  | "eof";

export interface Token {
  kind: TokenKind;
  value: string;
  start: number;
  end: number;
}

const DOUBLE_OPERATORS = new Set(["<=", ">=", "==", "!=", "&&", "||"]);
const SINGLE_OPERATORS = new Set(["+", "-", "*", "/", "%", "<", ">", "!"]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const character = source[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (source.slice(index, index + 2) === "//") {
      const newline = source.indexOf("\n", index + 2);
      index = newline === -1 ? source.length : newline + 1;
      continue;
    }

    const double = source.slice(index, index + 2);
    if (DOUBLE_OPERATORS.has(double)) {
      tokens.push({
        kind: "operator",
        value: double,
        start: index,
        end: index + 2,
      });
      index += 2;
      continue;
    }

    if (SINGLE_OPERATORS.has(character)) {
      tokens.push({
        kind: "operator",
        value: character,
        start: index,
        end: index + 1,
      });
      index += 1;
      continue;
    }

    if (/\d/.test(character) || (character === "." && /\d/.test(source[index + 1] ?? ""))) {
      const start = index;
      let sawDot = false;
      while (index < source.length) {
        const next = source[index];
        if (next === ".") {
          if (sawDot) break;
          sawDot = true;
          index += 1;
          continue;
        }
        if (!/\d/.test(next)) break;
        index += 1;
      }
      const value = source.slice(start, index);
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new EquationError("TOKEN", `Invalid number “${value}”.`, start, index);
      }
      tokens.push({ kind: "number", value, start, end: index });
      continue;
    }

    if (/[A-Za-z_]/.test(character)) {
      const start = index;
      index += 1;
      while (index < source.length && /[A-Za-z0-9_]/.test(source[index])) {
        index += 1;
      }
      tokens.push({
        kind: "identifier",
        value: source.slice(start, index),
        start,
        end: index,
      });
      continue;
    }

    const punctuation: Record<string, TokenKind> = {
      "(": "leftParen",
      ")": "rightParen",
      ",": "comma",
      "?": "question",
      ":": "colon",
    };
    const kind = punctuation[character];
    if (kind) {
      tokens.push({ kind, value: character, start: index, end: index + 1 });
      index += 1;
      continue;
    }

    if (character === "=") {
      throw new EquationError(
        "TOKEN",
        "Assignments are not allowed. Use == to compare values.",
        index
      );
    }

    throw new EquationError(
      "TOKEN",
      `Unsupported character “${character}”.`,
      index
    );
  }

  tokens.push({
    kind: "eof",
    value: "",
    start: source.length,
    end: source.length,
  });
  return tokens;
}
