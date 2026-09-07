export type EquationMode = "2d" | "3d";
export type EquationValue = number | boolean;
export type VariableName = "x" | "y" | "z";

interface NodeBase {
  start: number;
  end: number;
}

export interface LiteralNode extends NodeBase {
  type: "literal";
  value: EquationValue;
}

export interface VariableNode extends NodeBase {
  type: "variable";
  name: VariableName;
}

export interface UnaryNode extends NodeBase {
  type: "unary";
  operator: "+" | "-" | "!";
  argument: ExpressionNode;
}

export interface BinaryNode extends NodeBase {
  type: "binary";
  operator:
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "<"
    | "<="
    | ">"
    | ">="
    | "=="
    | "!="
    | "&&"
    | "||";
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface ConditionalNode extends NodeBase {
  type: "conditional";
  condition: ExpressionNode;
  consequent: ExpressionNode;
  alternate: ExpressionNode;
}

export type MathFunctionName =
  | "abs"
  | "min"
  | "max"
  | "sqrt"
  | "floor"
  | "ceil"
  | "round"
  | "pow";

export interface CallNode extends NodeBase {
  type: "call";
  name: MathFunctionName;
  arguments: ExpressionNode[];
}

export type ExpressionNode =
  | LiteralNode
  | VariableNode
  | UnaryNode
  | BinaryNode
  | ConditionalNode
  | CallNode;

export interface CompiledEquation {
  source: string;
  mode: EquationMode;
  ast: ExpressionNode;
  complexity: number;
  nodeCount: number;
}
