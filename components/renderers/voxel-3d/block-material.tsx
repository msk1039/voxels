"use client";

import { useMemo } from "react";
import {
  Color,
  DataTexture,
  NearestFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  Vector4,
  WebGLProgramParametersWithUniforms,
} from "three";

import {
  ATLAS_COLUMNS,
  ATLAS_ROWS,
  GLASS_ROW,
  TILE_SIZE,
  createBlockAtlas,
} from "@/lib/block-atlas";
import { MATCH_COLORS } from "@/lib/materials";

import { RenderQuality, VoxelGroup } from "./types";

let atlasTexture: DataTexture | null = null;

/** One shared nearest-filtered atlas texture for every block material. */
export function getBlockAtlasTexture() {
  if (atlasTexture) return atlasTexture;
  const atlas = createBlockAtlas();
  atlasTexture = new DataTexture(
    atlas.data,
    atlas.width,
    atlas.height,
    RGBAFormat,
    UnsignedByteType
  );
  atlasTexture.colorSpace = SRGBColorSpace;
  atlasTexture.magFilter = NearestFilter;
  atlasTexture.minFilter = NearestFilter;
  atlasTexture.generateMipmaps = false;
  atlasTexture.needsUpdate = true;
  return atlasTexture;
}

interface AppearanceStyle {
  /** rgb tint mixed over the texture, with alpha as the mix amount. */
  tint: [string, number];
  /** Pixel outline colour, with alpha as opacity (0 hides it). */
  outline: [string, number];
  glass: boolean;
}

const APPEARANCE: Record<VoxelGroup["appearance"], AppearanceStyle> = {
  material: { tint: ["#ffffff", 0], outline: ["#000000", 0], glass: false },
  correct: { tint: [MATCH_COLORS.correct, 0.14], outline: ["#000000", 0], glass: false },
  extra: { tint: [MATCH_COLORS.extra, 0.5], outline: ["#5c0f16", 0.9], glass: false },
  wrong: { tint: [MATCH_COLORS.wrongMaterial, 0.42], outline: ["#2c1640", 0.9], glass: false },
  missing: { tint: [MATCH_COLORS.missing, 0.35], outline: ["#dff1ff", 0.95], glass: true },
};

function toVector4([hex, amount]: [string, number]) {
  const color = new Color(hex);
  return new Vector4(color.r, color.g, color.b, amount);
}

function createUniforms(style: AppearanceStyle) {
  return {
    uAtlas: { value: getBlockAtlasTexture() },
    uTint: { value: toVector4(style.tint) },
    uOutline: { value: toVector4(style.outline) },
    uGlass: { value: style.glass ? 1 : 0 },
    uAoStrength: { value: style.glass ? 0 : 1 },
  };
}

const VERTEX_HEADER = /* glsl */ `
  attribute float aBlock;
  attribute vec2 aNeighbors;
  varying vec3 vBlockLocal;
  varying vec3 vBlockNormal;
  varying vec2 vBlockUv;
  varying float vBlock;
  varying vec2 vNeighbors;
`;

const VERTEX_BODY = /* glsl */ `
  vBlockLocal = position;
  vBlockNormal = normal;
  vBlockUv = uv;
  vBlock = aBlock;
  vNeighbors = aNeighbors;
`;

const FRAGMENT_HEADER = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform vec4 uTint;
  uniform vec4 uOutline;
  uniform float uGlass;
  uniform float uAoStrength;
  varying vec3 vBlockLocal;
  varying vec3 vBlockNormal;
  varying vec2 vBlockUv;
  varying float vBlock;
  varying vec2 vNeighbors;

  bool blockNeighbor(ivec3 offset) {
    int index = (offset.x + 1) * 9 + (offset.y + 1) * 3 + (offset.z + 1);
    if (index > 13) index -= 1;
    int word = index < 13 ? int(vNeighbors.x + 0.5) : int(vNeighbors.y + 0.5);
    int bit = index < 13 ? index : index - 13;
    return ((word >> bit) & 1) == 1;
  }

  // Classic voxel AO for one face corner: two sides plus the diagonal.
  float cornerAo(ivec3 n, ivec3 u, ivec3 v) {
    bool side1 = blockNeighbor(n + u);
    bool side2 = blockNeighbor(n + v);
    bool corner = blockNeighbor(n + u + v);
    if (side1 && side2) return 0.0;
    return 3.0 - float(side1) - float(side2) - float(corner);
  }
`;

const FRAGMENT_BODY = /* glsl */ `
  vec3 blockN = normalize(vBlockNormal);
  vec3 absN = abs(blockN);
  ivec3 n = ivec3(round(blockN));
  ivec3 axisU;
  ivec3 axisV;
  float column;
  float faceShade;
  if (absN.y > 0.5) {
    axisU = ivec3(1, 0, 0);
    axisV = ivec3(0, 0, 1);
    column = blockN.y > 0.0 ? 0.0 : 2.0;
    faceShade = blockN.y > 0.0 ? 1.0 : 0.55;
  } else if (absN.x > 0.5) {
    axisU = ivec3(0, 0, 1);
    axisV = ivec3(0, 1, 0);
    column = 1.0;
    faceShade = 0.84;
  } else {
    axisU = ivec3(1, 0, 0);
    axisV = ivec3(0, 1, 0);
    column = 1.0;
    faceShade = 0.7;
  }

  float row = uGlass > 0.5 ? ${GLASS_ROW.toFixed(1)} : clamp(floor(vBlock + 0.5) - 1.0, 0.0, ${(ATLAS_ROWS - 2).toFixed(1)});
  vec2 tileUv = clamp(vBlockUv, 0.001, 0.999);
  vec2 atlasUv = vec2(
    (column + tileUv.x) / ${ATLAS_COLUMNS.toFixed(1)},
    (row + 1.0 - tileUv.y) / ${ATLAS_ROWS.toFixed(1)}
  );
  vec4 texel = texture2D(uAtlas, atlasUv);

  // Smooth corner AO, blended bilinearly across the face.
  float fu = dot(vBlockLocal, vec3(axisU)) + 0.5;
  float fv = dot(vBlockLocal, vec3(axisV)) + 0.5;
  float ao00 = cornerAo(n, -axisU, -axisV);
  float ao10 = cornerAo(n, axisU, -axisV);
  float ao01 = cornerAo(n, -axisU, axisV);
  float ao11 = cornerAo(n, axisU, axisV);
  float ao = mix(mix(ao00, ao10, fu), mix(ao01, ao11, fu), fv) / 3.0;
  float aoShade = mix(1.0, 0.5 + 0.5 * ao, uAoStrength);

  vec3 blockColor = mix(texel.rgb, uTint.rgb * (0.55 + 0.45 * dot(texel.rgb, vec3(0.333))), uTint.a);

  // A one-texel outline around each face, for highlighted blocks.
  float texelEdge = 1.0 / ${TILE_SIZE.toFixed(1)};
  float edge = step(tileUv.x, texelEdge) + step(1.0 - texelEdge, tileUv.x)
    + step(tileUv.y, texelEdge) + step(1.0 - texelEdge, tileUv.y);
  float outline = min(edge, 1.0) * uOutline.a;
  blockColor = mix(blockColor, uOutline.rgb, outline);

  diffuseColor.rgb *= blockColor * faceShade * aoShade;
  diffuseColor.a *= uGlass > 0.5 ? max(texel.a, outline) : 1.0;
`;

interface BlockMaterialProps {
  appearance: VoxelGroup["appearance"];
  ghost?: boolean;
  quality: RenderQuality;
}

/**
 * Lambert shading with the block atlas, Minecraft face shading and baked
 * corner AO patched in. The same program serves both quality tiers; high
 * quality adds shadows, which Lambert still receives.
 */
export function BlockMaterial({ appearance, ghost = false }: BlockMaterialProps) {
  const style = APPEARANCE[appearance];
  // The compiled shader keeps references to these uniform objects. Callers
  // key this component by appearance, so a new style gets a new material.
  const uniforms = useMemo(() => createUniforms(style), [style]);

  function patchShader(shader: WebGLProgramParametersWithUniforms) {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_HEADER}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_HEADER}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_BODY}`);
  }

  return (
    <meshLambertMaterial
      transparent={ghost}
      depthWrite={!ghost}
      alphaTest={ghost ? 0.02 : 0}
      onBeforeCompile={patchShader}
      customProgramCacheKey={() => "voxels-block-v1"}
    />
  );
}
