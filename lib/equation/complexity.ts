import { ExpressionNode } from "./ast";

export function getNodeCount(node: ExpressionNode): number {
  switch (node.type) {
    case "literal":
    case "variable":
      return 1;
    case "unary":
      return 1 + getNodeCount(node.argument);
    case "binary":
      return 1 + getNodeCount(node.left) + getNodeCount(node.right);
    case "conditional":
      return (
        1 +
        getNodeCount(node.condition) +
        getNodeCount(node.consequent) +
        getNodeCount(node.alternate)
      );
    case "call":
      return 1 + node.arguments.reduce((sum, argument) => sum + getNodeCount(argument), 0);
  }
}

export function getComplexity(node: ExpressionNode): number {
  switch (node.type) {
    case "literal":
    case "variable":
      return 0;
    case "unary":
      return 1 + getComplexity(node.argument);
    case "binary":
      return 1 + getComplexity(node.left) + getComplexity(node.right);
    case "conditional":
      return (
        2 +
        getComplexity(node.condition) +
        getComplexity(node.consequent) +
        getComplexity(node.alternate)
      );
    case "call":
      return 1 + node.arguments.reduce((sum, argument) => sum + getComplexity(argument), 0);
  }
}
