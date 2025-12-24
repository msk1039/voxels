// 10 fixed colors mapped to numbers 1-10
export const COLORS: Record<number, string> = {
  1: "#e74c3c", // Red
  2: "#e67e22", // Orange
  3: "#f1c40f", // Yellow
  4: "#2ecc71", // Green
  5: "#1abc9c", // Teal
  6: "#3498db", // Blue
  7: "#9b59b6", // Purple
  8: "#e91e63", // Pink
  9: "#795548", // Brown
  10: "#ecf0f1", // White
};

export const DEFAULT_COLOR = "#3498db";

export const DEFAULT_EQUATION = `// x, y, z range from -5 to 5
// return true for default color
// return 1-10 for specific color
// return false/null to skip

const r = Math.sqrt(x*x + y*y + z*z);
if (r > 5) return false;
return Math.floor(r / 2) + 1;`;

export const GRID_SIZE = 11;
