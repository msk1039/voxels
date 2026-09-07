import {
  CompiledEquation,
  EquationValue,
  ExpressionNode,
  MathFunctionName,
} from "./ast";
import { EquationError } from "./error";

const OPERATIONS_PER_COORDINATE = 500;

interface EvaluationContext {
  x: number;
  y: number;
  z: number;
}

interface Budget {
  remaining: number;
}

function consumeOperation(node: ExpressionNode, budget: Budget) {
  budget.remaining -= 1;
  if (budget.remaining < 0) {
    throw new EquationError(
      "LIMIT",
      "The equation uses too many operations for one cell.",
      node.start,
      node.end
    );
  }
}

function requireNumber(
  value: EquationValue,
  node: ExpressionNode,
  operation: string
): number {
  if (typeof value !== "number") {
    throw new EquationError(
      "TYPE",
      `${operation} requires numbers.`,
      node.start,
      node.end
    );
  }
  return value;
}

function requireBoolean(
  value: EquationValue,
  node: ExpressionNode,
  operation: string
): boolean {
  if (typeof value !== "boolean") {
    throw new EquationError(
      "TYPE",
      `${operation} requires true or false values.`,
      node.start,
      node.end
    );
  }
  return value;
}

function ensureFinite(value: number, node: ExpressionNode): number {
  if (!Number.isFinite(value)) {
    throw new EquationError(
      "MATH",
      "This calculation does not produce a finite number.",
      node.start,
      node.end
    );
  }
  return value;
}

function evaluateCall(
  name: MathFunctionName,
  values: number[],
  node: ExpressionNode
): number {
  const functions: Record<MathFunctionName, (...args: number[]) => number> = {
    abs: Math.abs,
    min: Math.min,
    max: Math.max,
    sqrt: Math.sqrt,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    pow: Math.pow,
  };
  return ensureFinite(functions[name](...values), node);
}

function evaluateNode(
  node: ExpressionNode,
  context: EvaluationContext,
  budget: Budget
): EquationValue {
  consumeOperation(node, budget);

  switch (node.type) {
    case "literal":
      return node.value;
    case "variable":
      return context[node.name];
    case "unary": {
      const value = evaluateNode(node.argument, context, budget);
      if (node.operator === "!") {
        return !requireBoolean(value, node.argument, "!");
      }
      const number = requireNumber(value, node.argument, node.operator);
      return node.operator === "-" ? -number : number;
    }
    case "binary": {
      if (node.operator === "&&") {
        const left = requireBoolean(
          evaluateNode(node.left, context, budget),
          node.left,
          "&&"
        );
        return left
          ? requireBoolean(
              evaluateNode(node.right, context, budget),
              node.right,
              "&&"
            )
          : false;
      }
      if (node.operator === "||") {
        const left = requireBoolean(
          evaluateNode(node.left, context, budget),
          node.left,
          "||"
        );
        return left
          ? true
          : requireBoolean(
              evaluateNode(node.right, context, budget),
              node.right,
              "||"
            );
      }

      const leftValue = evaluateNode(node.left, context, budget);
      const rightValue = evaluateNode(node.right, context, budget);
      if (node.operator === "==") return leftValue === rightValue;
      if (node.operator === "!=") return leftValue !== rightValue;

      const left = requireNumber(leftValue, node.left, node.operator);
      const right = requireNumber(rightValue, node.right, node.operator);
      switch (node.operator) {
        case "+":
          return ensureFinite(left + right, node);
        case "-":
          return ensureFinite(left - right, node);
        case "*":
          return ensureFinite(left * right, node);
        case "/":
          if (right === 0) {
            throw new EquationError(
              "MATH",
              "Division by zero is not allowed.",
              node.right.start,
              node.right.end
            );
          }
          return ensureFinite(left / right, node);
        case "%":
          if (right === 0) {
            throw new EquationError(
              "MATH",
              "Modulo by zero is not allowed.",
              node.right.start,
              node.right.end
            );
          }
          return ensureFinite(left % right, node);
        case "<":
          return left < right;
        case "<=":
          return left <= right;
        case ">":
          return left > right;
        case ">=":
          return left >= right;
      }
    }
    case "conditional": {
      const condition = requireBoolean(
        evaluateNode(node.condition, context, budget),
        node.condition,
        "A conditional expression"
      );
      return evaluateNode(
        condition ? node.consequent : node.alternate,
        context,
        budget
      );
    }
    case "call": {
      const values = node.arguments.map((argument) =>
        requireNumber(
          evaluateNode(argument, context, budget),
          argument,
          node.name
        )
      );
      return evaluateCall(node.name, values, node);
    }
  }
}

export function evaluateEquationValue(
  equation: CompiledEquation,
  context: EvaluationContext
): EquationValue {
  return evaluateNode(equation.ast, context, {
    remaining: OPERATIONS_PER_COORDINATE,
  });
}

export function evaluateMaterial(
  equation: CompiledEquation,
  context: EvaluationContext
): number {
  const value = evaluateEquationValue(equation, context);
  if (value === false || value === 0) return 0;
  if (value === true) return 1;
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 8) {
    return value;
  }
  throw new EquationError(
    "RESULT",
    "Each cell must return false, true, 0, or a material number from 1 to 8.",
    equation.ast.start,
    equation.ast.end
  );
}
