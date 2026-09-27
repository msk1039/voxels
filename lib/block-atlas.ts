import { BLOCKS, BlockPattern, getBlock } from "@/lib/blocks";

/**
 * A procedurally painted 16×16 texture atlas. Row r holds block r+1 with
 * columns top / side / bottom; the last row holds utility tiles. Everything
 * is generated from seeded noise, so there are no image assets and the
 * output is identical on the server, in the browser and in tests.
 */

export const TILE_SIZE = 16;
export const ATLAS_COLUMNS = 3;
export const GLASS_ROW = BLOCKS.length;
export const ATLAS_ROWS = BLOCKS.length + 1;
export const ATLAS_WIDTH = TILE_SIZE * ATLAS_COLUMNS;
export const ATLAS_HEIGHT = TILE_SIZE * ATLAS_ROWS;

export type BlockFace = "top" | "side" | "bottom";
const FACE_COLUMN: Record<BlockFace, number> = { top: 0, side: 1, bottom: 2 };

export interface AtlasPixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

type Rgb = [number, number, number];
type Painter = (x: number, y: number, random: () => number) => Rgb | [...Rgb, number];

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic per-pixel hash for patterns that need spatial noise. */
function hash2(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function shade([r, g, b]: Rgb, factor: number): Rgb {
  return [r * factor, g * factor, b * factor];
}

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ];
}

/** Snap noise to a few levels, the way hand-made pixel art uses a small ramp. */
function ramp(value: number, steps = 4) {
  return Math.floor(value * steps) / (steps - 1);
}

const DIRT: Rgb = [122, 83, 52];

function painterFor(pattern: BlockPattern, face: BlockFace, base: Rgb): Painter {
  switch (pattern) {
    case "planks":
      return (x, y, random) => {
        const board = Math.floor(y / 4);
        const seamX = (board % 2 === 0 ? 3 : 11) + (board === 2 ? 4 : 0);
        if (y % 4 === 3) return shade(base, 0.62);
        if (x === seamX % 16) return shade(base, 0.72);
        const grain = hash2(Math.floor(x / 3), y, board + 11) > 0.72 ? 0.9 : 1;
        return shade(base, grain * (0.94 + ramp(random(), 3) * 0.1));
      };
    case "brick":
      return (x, y, random) => {
        const mortar: Rgb = [196, 184, 170];
        const course = Math.floor(y / 4);
        const offset = course % 2 === 0 ? 0 : 4;
        if (y % 4 === 3 || (x + offset) % 8 === 7) {
          return shade(mortar, 0.9 + random() * 0.12);
        }
        const brickShade = 0.86 + hash2(Math.floor((x + offset) / 8), course, 5) * 0.2;
        const edge = y % 4 === 0 ? 1.08 : 1;
        return shade(base, brickShade * edge * (0.95 + random() * 0.08));
      };
    case "sand":
      return (_x, _y, random) => {
        const speck = random();
        if (speck > 0.9) return shade(base, 1.1);
        if (speck < 0.1) return shade(base, 0.82);
        return shade(base, 0.95 + ramp(random(), 3) * 0.07);
      };
    case "grass": {
      const green = base;
      if (face === "top") {
        return (_x, _y, random) =>
          shade(green, 0.84 + ramp(random(), 4) * 0.22);
      }
      if (face === "bottom") {
        return (_x, _y, random) => shade(DIRT, 0.85 + ramp(random(), 4) * 0.25);
      }
      return (x, y, random) => {
        // Grass fringe hangs 2–4 px down the side, with a jagged edge.
        const fringe = 2 + Math.floor(hash2(x, 0, 23) * 3);
        if (y < fringe) return shade(green, 0.8 + ramp(random(), 3) * 0.2);
        if (y === fringe && hash2(x, 1, 29) > 0.6) return shade(green, 0.72);
        return shade(DIRT, 0.85 + ramp(random(), 4) * 0.25);
      };
    }
    case "prismarine":
      return (x, y, random) => {
        const cell = hash2(Math.floor(x / 4), Math.floor(y / 4), 41);
        const tint = mix(base, [70, 150, 120], cell * 0.4);
        const crack = (x + y * 3) % 9 === 0 && random() > 0.35;
        return shade(tint, crack ? 1.18 : 0.86 + ramp(random(), 3) * 0.16);
      };
    case "lapis":
      return (x, y, random) => {
        const swirl = Math.sin((x + y * 0.7) * 0.9) + Math.cos((y - x * 0.4) * 1.1);
        const light = swirl > 1.1 ? 1.16 : swirl < -1.1 ? 0.78 : 0.94;
        if (random() > 0.965) return [214, 184, 92];
        return shade(base, light * (0.96 + random() * 0.06));
      };
    case "amethyst":
      return (x, y, random) => {
        const facet = (x + y) % 6;
        const cross = (x - y + 32) % 7;
        let light = 0.9;
        if (facet === 0) light = 1.22;
        else if (cross === 0) light = 0.72;
        else if (facet === 1) light = 1.06;
        return shade(base, light * (0.96 + random() * 0.06));
      };
    case "wool":
      return (x, y, random) => {
        const knit = (x + (y % 2)) % 2 === 0 ? 1.03 : 0.95;
        const clump = hash2(Math.floor(x / 2), Math.floor(y / 2), 61) > 0.8 ? 0.9 : 1;
        return shade(base, knit * clump * (0.97 + random() * 0.05));
      };
  }
}

/** Mostly clear glass with a bright frame and two glints; used for ghosts. */
const paintGlass: Painter = (x, y) => {
  const frame = x === 0 || y === 0 || x === 15 || y === 15;
  if (frame) return [236, 250, 255, 235];
  const glint = (x - y === 4 && x > 4 && x < 12) || (x - y === 7 && x > 8 && x < 14);
  if (glint) return [255, 255, 255, 170];
  return [200, 232, 255, 46];
};

function paintTile(
  data: Uint8ClampedArray,
  column: number,
  row: number,
  painter: Painter,
  seed: number
) {
  const random = mulberry32(seed);
  for (let y = 0; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 1) {
      const [r, g, b, a = 255] = painter(x, y, random);
      const offset = ((row * TILE_SIZE + y) * ATLAS_WIDTH + column * TILE_SIZE + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }
}

let cachedAtlas: AtlasPixels | null = null;

export function createBlockAtlas(): AtlasPixels {
  if (cachedAtlas) return cachedAtlas;
  const data = new Uint8ClampedArray(ATLAS_WIDTH * ATLAS_HEIGHT * 4);
  BLOCKS.forEach((block, row) => {
    const base = hexToRgb(block.color);
    (["top", "side", "bottom"] as const).forEach((face) => {
      paintTile(
        data,
        FACE_COLUMN[face],
        row,
        painterFor(block.pattern, face, base),
        block.material * 97 + FACE_COLUMN[face] * 13
      );
    });
  });
  for (let column = 0; column < ATLAS_COLUMNS; column += 1) {
    paintTile(data, column, GLASS_ROW, paintGlass, 7);
  }
  cachedAtlas = { width: ATLAS_WIDTH, height: ATLAS_HEIGHT, data };
  return cachedAtlas;
}

export function getTilePixels(material: number | "glass", face: BlockFace = "side") {
  const atlas = createBlockAtlas();
  const row = material === "glass" ? GLASS_ROW : getBlock(material).material - 1;
  const column = FACE_COLUMN[face];
  const data = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
  for (let y = 0; y < TILE_SIZE; y += 1) {
    const from = ((row * TILE_SIZE + y) * ATLAS_WIDTH + column * TILE_SIZE) * 4;
    data.set(atlas.data.subarray(from, from + TILE_SIZE * 4), y * TILE_SIZE * 4);
  }
  return { width: TILE_SIZE, height: TILE_SIZE, data };
}

const tileUrlCache = new Map<string, string>();

/** A PNG data URL for one tile, safe to call during server rendering. */
export function getTileDataUrl(material: number | "glass", face: BlockFace = "side") {
  const key = `${material}:${face}`;
  const cached = tileUrlCache.get(key);
  if (cached) return cached;
  const tile = getTilePixels(material, face);
  const url = `data:image/png;base64,${toBase64(encodePng(tile.width, tile.height, tile.data))}`;
  tileUrlCache.set(key, url);
  return url;
}

/* ---- Minimal PNG encoder (stored deflate blocks, no compression). ---- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array) {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function u32(value: number) {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function chunk(type: string, body: Uint8Array) {
  const typed = new Uint8Array(4 + body.length);
  for (let i = 0; i < 4; i += 1) typed[i] = type.charCodeAt(i);
  typed.set(body, 4);
  return [...u32(body.length), ...typed, ...u32(crc32(typed))];
}

export function encodePng(width: number, height: number, rgba: Uint8ClampedArray) {
  const raw = new Uint8Array(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  const deflate: number[] = [0x78, 0x01];
  for (let offset = 0; offset < raw.length || offset === 0; offset += 65535) {
    const block = raw.subarray(offset, offset + 65535);
    const final = offset + 65535 >= raw.length ? 1 : 0;
    deflate.push(final, block.length & 255, block.length >> 8, ~block.length & 255, (~block.length >> 8) & 255);
    for (const byte of block) deflate.push(byte);
    if (final) break;
  }
  deflate.push(...u32(adler32(raw)));

  const header = new Uint8Array([...u32(width), ...u32(height), 8, 6, 0, 0, 0]);
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    ...chunk("IHDR", header),
    ...chunk("IDAT", new Uint8Array(deflate)),
    ...chunk("IEND", new Uint8Array()),
  ]);
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(bytes: Uint8Array) {
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    output += BASE64[(triple >> 18) & 63] + BASE64[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64[(triple >> 6) & 63] : "=";
    output += i + 2 < bytes.length ? BASE64[triple & 63] : "=";
  }
  return output;
}
