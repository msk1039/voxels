import {
  BinaryNode,
  CallNode,
  CompiledEquation,
  EquationMode,
  ExpressionNode,
  MathFunctionName,
  VariableName,
} from "./ast";
import { getComplexity, getNodeCount } from "./complexity";
import { EquationError } from "./error";
import { Token, TokenKind, tokenize } from "./tokens";

const MAX_AST_NODES = 160;
const MAX_AST_DEPTH = 40;

const FUNCTION_ARITY: Record<
  MathFunctionName,
  { min: number; max: number }
> = {
  abs: { min: 1, max: 1 },
  min: { min: 2, max: 8 },
  max: { min: 2, max: 8 },
  sqrt: { min: 1, max: 1 },
  floor: { min: 1, max: 1 },
  ceil: { min: 1, max: 1 },
  round: { min: 1, max: 1 },
  pow: { min: 2, max: 2 },
};

const VARIABLES = new Set<VariableName>(["x", "y", "z"]);
const FUNCTIONS = new Set<MathFunctionName>(
  Object.keys(FUNCTION_ARITY) as MathFunctionName[]
);

class Parser {
  private index = 0;

  constructor(
    private readonly source: string,
    private readonly mode: EquationMode,
    private readonly tokens: Token[]
  ) {}

  parse(): ExpressionNode {
    if (this.current().kind === "eof") {
      throw new EquationError("SYNTAX", "Enter an equation first.", 0);
    }
    const expression = this.parseConditional();
    const remaining = this.current();
    if (remaining.kind !== "eof") {
      throw new EquationError(
        "SYNTAX",
        `Unexpected “${remaining.value}”.`,
        remaining.start,
        remaining.end
      );
    }
    return expression;
  }

  private parseConditional(): ExpressionNode {
    const condition = this.parseOr();
    if (!this.match("question")) return condition;
    const consequent = this.parseConditional();
    this.consume("colon", "Expected : in the conditional expression.");
    const alternate = this.parseConditional();
    return {
      type: "conditional",
      condition,
      consequent,
      alternate,
      start: condition.start,
      end: alternate.end,
    };
  }

  private parseOr(): ExpressionNode {
    return this.parseBinary(() => this.parseAnd(), new Set(["||"]));
  }

  private parseAnd(): ExpressionNode {
    return this.parseBinary(() => this.parseEquality(), new Set(["&&"]));
  }

  private parseEquality(): ExpressionNode {
    return this.parseBinary(() => this.parseComparison(), new Set(["==", "!="]));
  }

  private parseComparison(): ExpressionNode {
    return this.parseBinary(
      () => this.parseAdditive(),
      new Set(["<", "<=", ">", ">="])
    );
  }

  private parseAdditive(): ExpressionNode {
    return this.parseBinary(() => this.parseMultiplicative(), new Set(["+", "-"]));
  }

  private parseMultiplicative(): ExpressionNode {
    return this.parseBinary(() => this.parseUnary(), new Set(["*", "/", "%"]));
  }

  private parseBinary(
    operand: () => ExpressionNode,
    operators: Set<string>
  ): ExpressionNode {
    let left = operand();
    while (
      this.current().kind === "operator" &&
      operators.has(this.current().value)
    ) {
      const operator = this.advance();
      const right = operand();
      left = {
        type: "binary",
        operator: operator.value as BinaryNode["operator"],
        left,
        right,
        start: left.start,
        end: right.end,
      };
    }
    return left;
  }

  private parseUnary(): ExpressionNode {
    const token = this.current();
    if (
      token.kind === "operator" &&
      (token.value === "+" || token.value === "-" || token.value === "!")
    ) {
      this.advance();
      const argument = this.parseUnary();
      return {
        type: "unary",
        operator: token.value,
        argument,
        start: token.start,
        end: argument.end,
      };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const token = this.current();

    if (token.kind === "number") {
      this.advance();
      return {
        type: "literal",
        value: Number(token.value),
        start: token.start,
        end: token.end,
      };
    }

    if (token.kind === "identifier") {
      this.advance();
      if (token.value === "true" || token.value === "false") {
        return {
          type: "literal",
          value: token.value === "true",
          start: token.start,
          end: token.end,
        };
      }

      if (this.current().kind === "leftParen") {
        return this.parseCall(token);
      }

      if (VARIABLES.has(token.value as VariableName)) {
        const name = token.value as VariableName;
        if (this.mode === "2d" && name === "z") {
          throw new EquationError(
            "UNAVAILABLE_VARIABLE",
            "“z” is not available in Plane Lab. Use x and y for this level.",
            token.start,
            token.end
          );
        }
        return {
          type: "variable",
          name,
          start: token.start,
          end: token.end,
        };
      }

      throw new EquationError(
        "UNKNOWN_NAME",
        `Unknown name “${token.value}”.`,
        token.start,
        token.end
      );
    }

    if (this.match("leftParen")) {
      const start = token.start;
      const expression = this.parseConditional();
      const close = this.consume("rightParen", "Expected ) to close the group.");
      return { ...expression, start, end: close.end };
    }

    throw new EquationError(
      "SYNTAX",
      token.kind === "eof"
        ? "The equation ends before the expression is complete."
        : `Expected a number, variable, or group instead of “${token.value}”.`,
      token.start,
      token.end
    );
  }

  private parseCall(nameToken: Token): CallNode {
    if (!FUNCTIONS.has(nameToken.value as MathFunctionName)) {
      throw new EquationError(
        "UNKNOWN_NAME",
        `Unknown function “${nameToken.value}”.`,
        nameToken.start,
        nameToken.end
      );
    }

    const name = nameToken.value as MathFunctionName;
    this.consume("leftParen", "Expected ( after the function name.");
    const args: ExpressionNode[] = [];
    if (this.current().kind !== "rightParen") {
      do {
        args.push(this.parseConditional());
      } while (this.match("comma"));
    }
    const close = this.consume("rightParen", `Expected ) after ${name} arguments.`);
    const arity = FUNCTION_ARITY[name];
    if (args.length < arity.min || args.length > arity.max) {
      const expected =
        arity.min === arity.max
          ? `${arity.min} argument${arity.min === 1 ? "" : "s"}`
          : `${arity.min} to ${arity.max} arguments`;
      throw new EquationError(
        "SYNTAX",
        `${name} expects ${expected}, but received ${args.length}.`,
        nameToken.start,
        close.end
      );
    }
    return {
      type: "call",
      name,
      arguments: args,
      start: nameToken.start,
      end: close.end,
    };
  }

  private current(): Token {
    return this.tokens[this.index];
  }

  private advance(): Token {
    const token = this.current();
    if (token.kind !== "eof") this.index += 1;
    return token;
  }

  private match(kind: TokenKind): boolean {
    if (this.current().kind !== kind) return false;
    this.advance();
    return true;
  }

  private consume(kind: TokenKind, message: string): Token {
    if (this.current().kind === kind) return this.advance();
    const token = this.current();
    throw new EquationError("SYNTAX", message, token.start, token.end);
  }
}

function getDepth(node: ExpressionNode): number {
  switch (node.type) {
    case "literal":
    case "variable":
      return 1;
    case "unary":
      return 1 + getDepth(node.argument);
    case "binary":
      return 1 + Math.max(getDepth(node.left), getDepth(node.right));
    case "conditional":
      return (
        1 +
        Math.max(
          getDepth(node.condition),
          getDepth(node.consequent),
          getDepth(node.alternate)
        )
      );
    case "call":
      return 1 + Math.max(0, ...node.arguments.map(getDepth));
  }
}

export function compileEquation(
  source: string,
  mode: EquationMode
): CompiledEquation {
  const ast = new Parser(source, mode, tokenize(source)).parse();
  const nodeCount = getNodeCount(ast);
  if (nodeCount > MAX_AST_NODES) {
    throw new EquationError(
      "LIMIT",
      `This equation is too large. Keep it below ${MAX_AST_NODES} parts.`,
      ast.start,
      ast.end
    );
  }
  if (getDepth(ast) > MAX_AST_DEPTH) {
    throw new EquationError(
      "LIMIT",
      "This equation is nested too deeply.",
      ast.start,
      ast.end
    );
  }
  return {
    source,
    mode,
    ast,
    complexity: getComplexity(ast),
    nodeCount,
  };
}
