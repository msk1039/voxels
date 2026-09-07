import { EquationMode, compileEquation } from "@/lib/equation";
import { CellMap, Coordinate, GridSpec, createTarget } from "@/lib/grid";

export const DEFAULT_GRID: GridSpec = { min: -5, max: 5, step: 1 };

export interface LevelDefinition {
  id: string;
  mode: EquationMode;
  order: number;
  title: string;
  objective: string;
  concept: string;
  grid: GridSpec;
  starterExpression: string;
  target: CellMap;
  efficientCost: number;
  hints: readonly [string, string];
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

interface LevelSource
  extends Omit<LevelDefinition, "target" | "efficientCost" | "grid"> {
  solution: string;
  target: (coordinate: Coordinate) => boolean | number;
  efficientCost?: number;
  grid?: GridSpec;
}

const planeSources: LevelSource[] = [
  {
    id: "origin",
    mode: "2d",
    order: 1,
    title: "Origin",
    objective: "Place one cell at the center of the grid.",
    concept: "Coordinates and equality",
    starterExpression: "x == 0",
    solution: "x == 0 && y == 0",
    target: ({ x, y }) => x === 0 && y === 0,
    hints: [
      "The center has x equal to 0 and y equal to 0.",
      "Join the two equality checks with &&.",
    ],
  },
  {
    id: "divider",
    mode: "2d",
    order: 2,
    title: "Divider",
    objective: "Fill the vertical line through the center.",
    concept: "One-axis comparison",
    starterExpression: "x == 0",
    solution: "x == 0",
    target: ({ x }) => x === 0,
    hints: [
      "Every cell in the line shares the same x coordinate.",
      "The shared x coordinate is 0. y can have any value.",
    ],
  },
  {
    id: "crossroads",
    mode: "2d",
    order: 3,
    title: "Crossroads",
    objective: "Build both center lines.",
    concept: "Boolean OR",
    starterExpression: "x == 0",
    solution: "x == 0 || y == 0",
    target: ({ x, y }) => x === 0 || y === 0,
    hints: [
      "A cell belongs when it is on either center line.",
      "Combine x == 0 and y == 0 with ||.",
    ],
  },
  {
    id: "corner",
    mode: "2d",
    order: 4,
    title: "Corner",
    objective: "Fill the upper-right quarter, including both axes.",
    concept: "Boolean AND",
    starterExpression: "x >= 0",
    solution: "x >= 0 && y >= 0",
    target: ({ x, y }) => x >= 0 && y >= 0,
    hints: [
      "Both coordinates must be zero or positive.",
      "Combine x >= 0 and y >= 0 with &&.",
    ],
  },
  {
    id: "window",
    mode: "2d",
    order: 5,
    title: "Window",
    objective: "Draw a square frame four cells from the center.",
    concept: "Absolute value and maximum",
    starterExpression: "max(abs(x), abs(y))",
    solution: "max(abs(x), abs(y)) == 4",
    target: ({ x, y }) => Math.max(Math.abs(x), Math.abs(y)) === 4,
    hints: [
      "On a square frame, the larger distance from an axis is always 4.",
      "Compare max(abs(x), abs(y)) with 4.",
    ],
  },
  {
    id: "checkers",
    mode: "2d",
    order: 6,
    title: "Checkers",
    objective: "Fill alternating cells inside a nine-by-nine square.",
    concept: "Modulo",
    starterExpression: "abs(x) <= 4 && abs(y) <= 4",
    solution: "abs(x) <= 4 && abs(y) <= 4 && (x + y) % 2 == 0",
    target: ({ x, y }) =>
      Math.abs(x) <= 4 && Math.abs(y) <= 4 && (x + y) % 2 === 0,
    hints: [
      "Neighboring cells alternate when x + y changes between even and odd.",
      "An even value has (x + y) % 2 equal to 0.",
    ],
  },
  {
    id: "diamond",
    mode: "2d",
    order: 7,
    title: "Diamond",
    objective: "Fill a diamond with a radius of four cells.",
    concept: "Manhattan distance",
    starterExpression: "abs(x) + abs(y)",
    solution: "abs(x) + abs(y) <= 4",
    target: ({ x, y }) => Math.abs(x) + Math.abs(y) <= 4,
    hints: [
      "Add the horizontal and vertical distances from the center.",
      "Keep cells where abs(x) + abs(y) is at most 4.",
    ],
  },
  {
    id: "disc",
    mode: "2d",
    order: 8,
    title: "Disc",
    objective: "Fill a round disc with radius four.",
    concept: "Squared distance",
    starterExpression: "x*x + y*y",
    solution: "x*x + y*y <= 16",
    target: ({ x, y }) => x * x + y * y <= 16,
    hints: [
      "A circle uses x squared plus y squared.",
      "Radius 4 means the squared distance is at most 16.",
    ],
  },
  {
    id: "ring",
    mode: "2d",
    order: 9,
    title: "Ring",
    objective: "Keep only the outer band of a circle.",
    concept: "Combined bounds",
    starterExpression: "x*x + y*y <= 20",
    solution: "x*x + y*y >= 9 && x*x + y*y <= 20",
    target: ({ x, y }) => {
      const distance = x * x + y * y;
      return distance >= 9 && distance <= 20;
    },
    hints: [
      "A ring has both an inner and an outer radius.",
      "Keep squared distance between 9 and 20.",
    ],
  },
  {
    id: "four-corners",
    mode: "2d",
    order: 10,
    title: "Four Corners",
    objective: "Place a three-by-three block in every corner.",
    concept: "Symmetry",
    starterExpression: "abs(x) >= 3",
    solution: "abs(x) >= 3 && abs(y) >= 3",
    target: ({ x, y }) => Math.abs(x) >= 3 && Math.abs(y) >= 3,
    hints: [
      "Absolute values let one condition cover opposite sides.",
      "Both abs(x) and abs(y) must be at least 3.",
    ],
  },
  {
    id: "pixel-heart",
    mode: "2d",
    order: 11,
    title: "Pixel Heart",
    objective: "Combine a notched top with a tapered bottom.",
    concept: "Compound shape",
    starterExpression: "y >= 0",
    solution:
      "(y >= 0 && y <= 3 && abs(x) <= 4 - y && !(y == 3 && x == 0)) || (y < 0 && y >= -4 && abs(x) <= 4 + y)",
    target: ({ x, y }) =>
      (y >= 0 &&
        y <= 3 &&
        Math.abs(x) <= 4 - y &&
        !(y === 3 && x === 0)) ||
      (y < 0 && y >= -4 && Math.abs(x) <= 4 + y),
    hints: [
      "Treat the top and bottom as two shapes joined with ||.",
      "The top narrows with 4 - y; the bottom narrows with 4 + y.",
    ],
  },
  {
    id: "signal",
    mode: "2d",
    order: 12,
    title: "Signal",
    objective: "Build a square flag with red, blue, and yellow horizontal bands.",
    concept: "Conditional materials",
    starterExpression: "abs(x) <= 4 && abs(y) <= 4 ? 2 : 0",
    solution:
      "abs(x) <= 4 && abs(y) <= 4 ? (y > 1 ? 2 : y < -1 ? 6 : 3) : 0",
    target: ({ x, y }) => {
      if (Math.abs(x) > 4 || Math.abs(y) > 4) return 0;
      if (y > 1) return 2;
      if (y < -1) return 6;
      return 3;
    },
    hints: [
      "Use a conditional expression to choose a material number.",
      "Inside the square, use y > 1 ? 2 : y < -1 ? 6 : 3.",
    ],
  },
];

const volumeSources: LevelSource[] = [
  {
    id: "slice",
    mode: "3d",
    order: 1,
    title: "Slice",
    objective: "Build the center plane across x and y.",
    concept: "Introducing z",
    starterExpression: "z == 0",
    solution: "z == 0",
    target: ({ z }) => z === 0,
    hints: ["Every cell in the plane has the same z coordinate.", "Use z == 0."],
    camera: { position: [12, 10, 12], target: [0, 0, 0] },
  },
  {
    id: "beam",
    mode: "3d",
    order: 2,
    title: "Beam",
    objective: "Build a single vertical beam through the center.",
    concept: "Two fixed axes",
    starterExpression: "x == 0",
    solution: "x == 0 && z == 0",
    target: ({ x, z }) => x === 0 && z === 0,
    hints: ["A vertical beam lets y vary.", "Set both x and z equal to 0."],
  },
  {
    id: "slab",
    mode: "3d",
    order: 3,
    title: "Slab",
    objective: "Build a plane three voxels thick.",
    concept: "Bounded depth",
    starterExpression: "abs(z)",
    solution: "abs(z) <= 1",
    target: ({ z }) => Math.abs(z) <= 1,
    hints: ["The slab extends one cell to either side of z = 0.", "Use abs(z) <= 1."],
  },
  {
    id: "solid-cube",
    mode: "3d",
    order: 4,
    title: "Solid Cube",
    objective: "Build a seven-by-seven solid cube.",
    concept: "Three-axis bounds",
    starterExpression: "max(abs(x), abs(y), abs(z))",
    solution: "max(abs(x), abs(y), abs(z)) <= 3",
    target: ({ x, y, z }) => Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) <= 3,
    hints: ["The largest axis distance determines the cube boundary.", "Keep max(abs(x), abs(y), abs(z)) at most 3."],
  },
  {
    id: "cube-shell",
    mode: "3d",
    order: 5,
    title: "Cube Shell",
    objective: "Build only the outside of a nine-by-nine cube.",
    concept: "Surfaces",
    starterExpression: "max(abs(x), abs(y), abs(z))",
    solution: "max(abs(x), abs(y), abs(z)) == 4",
    target: ({ x, y, z }) => Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) === 4,
    hints: ["A shell keeps cells on the boundary, not inside it.", "Compare the maximum axis distance with exactly 4."],
  },
  {
    id: "axis-cross",
    mode: "3d",
    order: 6,
    title: "Axis Cross",
    objective: "Build the three center beams.",
    concept: "Three-way OR",
    starterExpression: "x == 0 && y == 0",
    solution:
      "(x == 0 && y == 0) || (x == 0 && z == 0) || (y == 0 && z == 0)",
    target: ({ x, y, z }) =>
      (x === 0 && y === 0) ||
      (x === 0 && z === 0) ||
      (y === 0 && z === 0),
    hints: ["Each beam fixes two coordinates and lets the third vary.", "Join the xy, xz, and yz beam conditions with ||."],
  },
  {
    id: "tower",
    mode: "3d",
    order: 7,
    title: "Tower",
    objective: "Build a vertical cylinder with radius three.",
    concept: "Radius plus height",
    starterExpression: "x*x + z*z <= 9",
    solution: "x*x + z*z <= 9 && abs(y) <= 4",
    target: ({ x, y, z }) => x * x + z * z <= 9 && Math.abs(y) <= 4,
    hints: ["Use x and z for the round footprint while y controls height.", "Combine x*x + z*z <= 9 with abs(y) <= 4."],
  },
  {
    id: "sphere",
    mode: "3d",
    order: 8,
    title: "Sphere",
    objective: "Fill a sphere with radius four.",
    concept: "Three-dimensional distance",
    starterExpression: "x*x + y*y + z*z",
    solution: "x*x + y*y + z*z <= 16",
    target: ({ x, y, z }) => x * x + y * y + z * z <= 16,
    hints: ["Add the squared distance on all three axes.", "Radius 4 gives a maximum squared distance of 16."],
  },
  {
    id: "planet-shell",
    mode: "3d",
    order: 9,
    title: "Planet Shell",
    objective: "Build a hollow spherical shell.",
    concept: "Radial range",
    starterExpression: "x*x + y*y + z*z <= 25",
    solution:
      "x*x + y*y + z*z >= 12 && x*x + y*y + z*z <= 25",
    target: ({ x, y, z }) => {
      const distance = x * x + y * y + z * z;
      return distance >= 12 && distance <= 25;
    },
    hints: ["A shell needs an inner and outer distance.", "Keep squared distance between 12 and 25."],
  },
  {
    id: "pyramid",
    mode: "3d",
    order: 10,
    title: "Pyramid",
    objective: "Build a stepped pyramid that narrows toward the top.",
    concept: "Coordinate-dependent bounds",
    starterExpression: "y >= -4 && y <= 4",
    solution:
      "y >= -4 && y <= 4 && max(abs(x), abs(z)) <= floor((4 - y) / 2)",
    target: ({ x, y, z }) =>
      y >= -4 &&
      y <= 4 &&
      Math.max(Math.abs(x), Math.abs(z)) <= Math.floor((4 - y) / 2),
    hints: ["The allowed width gets smaller as y increases.", "Use floor((4 - y) / 2) as the maximum x/z distance."],
  },
  {
    id: "layer-cake",
    mode: "3d",
    order: 11,
    title: "Layer Cake",
    objective: "Build a cube with three colored horizontal layers.",
    concept: "Material layers",
    starterExpression: "max(abs(x), abs(y), abs(z)) <= 3 ? 2 : 0",
    solution:
      "max(abs(x), abs(y), abs(z)) <= 3 ? (y > 1 ? 3 : y < -1 ? 6 : 2) : 0",
    target: ({ x, y, z }) => {
      if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > 3) return 0;
      if (y > 1) return 3;
      if (y < -1) return 6;
      return 2;
    },
    hints: ["First decide whether the cell is inside the cube.", "Inside, choose a material based on whether y is above 1, below -1, or between."],
  },
  {
    id: "planet-core",
    mode: "3d",
    order: 12,
    title: "Planet Core",
    objective: "Build a blue planet with a warm inner core.",
    concept: "Nested radial materials",
    starterExpression: "x*x + y*y + z*z <= 16 ? 6 : 0",
    solution:
      "x*x + y*y + z*z <= 16 ? (x*x + y*y + z*z <= 4 ? 2 : 6) : 0",
    target: ({ x, y, z }) => {
      const distance = x * x + y * y + z * z;
      if (distance > 16) return 0;
      return distance <= 4 ? 2 : 6;
    },
    hints: ["Use the squared distance for both boundaries.", "Inside radius 4, choose material 2 when squared distance is at most 4; otherwise choose 6."],
  },
];

const sources = [...planeSources, ...volumeSources];

export const LEVEL_SOLUTIONS = Object.fromEntries(
  sources.map((source) => [`${source.mode}:${source.id}`, source.solution])
) as Readonly<Record<string, string>>;

export const LEVELS: readonly LevelDefinition[] = sources.map(
  ({ solution, target, efficientCost, grid = DEFAULT_GRID, ...level }) => ({
    ...level,
    grid,
    target: createTarget(level.mode, grid, target),
    efficientCost:
      efficientCost ?? compileEquation(solution, level.mode).complexity,
  })
);

export function getLevelsForMode(mode: EquationMode): LevelDefinition[] {
  return LEVELS.filter((level) => level.mode === mode).sort(
    (a, b) => a.order - b.order
  );
}

export function getLevel(
  mode: EquationMode,
  id: string
): LevelDefinition | undefined {
  return LEVELS.find((level) => level.mode === mode && level.id === id);
}

export function getNextLevel(level: LevelDefinition): LevelDefinition | undefined {
  return getLevelsForMode(level.mode).find(
    (candidate) => candidate.order === level.order + 1
  );
}
