import { inflateSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import {
  ATLAS_HEIGHT,
  ATLAS_WIDTH,
  TILE_SIZE,
  createBlockAtlas,
  encodePng,
  getTileDataUrl,
  getTilePixels,
} from "../../lib/block-atlas";
import { BLOCKS } from "../../lib/blocks";

function hue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function averageColor(data: Uint8ClampedArray): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return [r / count, g / count, b / count];
}

function hexHue(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return hue((value >> 16) & 255, (value >> 8) & 255, value & 255);
}

describe("block atlas", () => {
  it("has one row per block plus a utility row, three faces wide", () => {
    const atlas = createBlockAtlas();
    expect(atlas.width).toBe(ATLAS_WIDTH);
    expect(atlas.height).toBe(ATLAS_HEIGHT);
    expect(ATLAS_WIDTH).toBe(TILE_SIZE * 3);
    expect(ATLAS_HEIGHT).toBe(TILE_SIZE * (BLOCKS.length + 1));
    expect(atlas.data).toHaveLength(ATLAS_WIDTH * ATLAS_HEIGHT * 4);
  });

  it("paints every block tile fully opaque", () => {
    for (const block of BLOCKS) {
      for (const face of ["top", "side", "bottom"] as const) {
        const tile = getTilePixels(block.material, face);
        for (let i = 3; i < tile.data.length; i += 4) {
          expect(tile.data[i]).toBe(255);
        }
      }
    }
  });

  it("keeps each block's top face close to its material hue", () => {
    for (const block of BLOCKS) {
      const [r, g, b] = averageColor(getTilePixels(block.material, "top").data);
      expect(
        hueDistance(hue(r, g, b), hexHue(block.color)),
        `${block.name} drifted from its ${block.hue} hue`
      ).toBeLessThan(25);
    }
  });

  it("gives grass green tops and dirt sides", () => {
    const [tr, tg, tb] = averageColor(getTilePixels(4, "top").data);
    expect(tg).toBeGreaterThan(tr);
    expect(tg).toBeGreaterThan(tb);
    const [dirtRed, dirtGreen, dirtBlue] = averageColor(getTilePixels(4, "bottom").data);
    expect(dirtRed).toBeGreaterThan(dirtGreen);
    expect(dirtGreen).toBeGreaterThan(dirtBlue);
  });

  it("draws glass as a clear pane with an opaque frame", () => {
    const glass = getTilePixels("glass");
    const alphaAt = (x: number, y: number) => glass.data[(y * TILE_SIZE + x) * 4 + 3];
    expect(alphaAt(0, 0)).toBeGreaterThan(200);
    expect(alphaAt(2, 12)).toBeLessThan(80);
  });

  it("is deterministic", () => {
    const first = getTileDataUrl(7, "side");
    expect(getTileDataUrl(7, "side")).toBe(first);
    expect(getTileDataUrl(7, "side")).toMatch(/^data:image\/png;base64,/);
  });
});

describe("png encoder", () => {
  it("writes a valid PNG with a decodable image stream", () => {
    const width = 3;
    const height = 2;
    const rgba = new Uint8ClampedArray(width * height * 4).map((_, i) => i * 7);
    const png = Buffer.from(encodePng(width, height, rgba));

    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.readUInt32BE(16)).toBe(width);
    expect(png.readUInt32BE(20)).toBe(height);

    const idatLength = png.readUInt32BE(33);
    expect(png.toString("ascii", 37, 41)).toBe("IDAT");
    const raw = inflateSync(png.subarray(41, 41 + idatLength));
    expect(raw).toHaveLength(height * (width * 4 + 1));
    // Row 1, pixel 0 comes after row 0's filter byte and pixels.
    expect(raw[width * 4 + 2]).toBe(rgba[width * 4]);
  });
});
