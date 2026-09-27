/**
 * Equations the title screen types out and builds, one after another.
 * Each runs on the default 3D grid from -5 to 5.
 */
export interface Showcase {
  name: string;
  equation: string;
}

export const SHOWCASE: readonly Showcase[] = [
  {
    name: "Floating Island",
    equation:
      "x*x + (y - 4)*(y - 4) + z*z <= 3 ? 4 : x == 0 && z == 0 && y > 0 ? 1 : y <= 0 && x*x + z*z <= (y + 5) * 4 ? (y == 0 ? 4 : 3) : 0",
  },
  {
    name: "Donut",
    equation: "pow(sqrt(x*x + z*z) - 3.5, 2) + y*y <= 1.6 ? (y > 0 ? 8 : 1) : 0",
  },
  {
    name: "Beacon",
    equation:
      "x == 0 && z == 0 && y >= -2 ? 5 : y <= -3 && max(abs(x), abs(z)) <= -2 - y ? 6 : 0",
  },
  {
    name: "Temple",
    equation:
      "y >= -4 && max(abs(x), abs(z)) <= 2 - y ? (y == -4 ? 4 : y % 2 == 0 ? 3 : 1) : 0",
  },
  {
    name: "Crystal",
    equation: "abs(x) + abs(y) * 0.6 + abs(z) <= 4 ? (abs(y) >= 3 ? 8 : 7) : 0",
  },
  {
    name: "Rainbow Arch",
    equation:
      "abs(z) <= 1 && y >= -2 && x*x + (y + 2)*(y + 2) <= 36 && x*x + (y + 2)*(y + 2) >= 16 ? (x*x + (y + 2)*(y + 2) >= 30 ? 2 : x*x + (y + 2)*(y + 2) >= 23 ? 3 : 6) : 0",
  },
  {
    name: "Geode",
    equation:
      "z <= 0 && x*x + y*y + z*z <= 25 ? (x*x + y*y + z*z >= 17 ? 6 : x*x + y*y + z*z >= 10 ? 7 : x*x + y*y + z*z <= 2 ? 8 : 0) : 0",
  },
  {
    name: "Checker Cube",
    equation: "max(abs(x), abs(y), abs(z)) <= 3 ? ((x + y + z) % 2 == 0 ? 3 : 2) : 0",
  },
];
