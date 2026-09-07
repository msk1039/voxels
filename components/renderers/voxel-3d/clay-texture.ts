import {
  DataTexture,
  LinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  UnsignedByteType,
} from "three";

export function createClayTexture(size: number) {
  const data = new Uint8Array(size * size * 4);
  let seed = 0x6d2b79f5;

  for (let index = 0; index < size * size; index += 1) {
    seed = (Math.imul(seed ^ (seed >>> 15), seed | 1) + index) | 0;
    const noise = 188 + ((seed >>> 24) & 47);
    const offset = index * 4;
    data[offset] = noise;
    data[offset + 1] = noise;
    data[offset + 2] = noise;
    data[offset + 3] = 255;
  }

  const texture = new DataTexture(
    data,
    size,
    size,
    RGBAFormat,
    UnsignedByteType
  );
  texture.colorSpace = NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
