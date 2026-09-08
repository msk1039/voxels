"use client";

import { useCallback } from "react";
import { DataTexture, WebGLProgramParametersWithUniforms } from "three";

import { RenderQuality } from "./types";

interface StylizedVoxelMaterialProps {
  detailTexture?: DataTexture;
  ghost?: boolean;
  quality: RenderQuality;
}

export function StylizedVoxelMaterial({
  detailTexture,
  ghost,
  quality,
}: StylizedVoxelMaterialProps) {
  const patchShader = useCallback((shader: WebGLProgramParametersWithUniforms) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vVoxelLocalPosition;
         varying float vVoxelSeed;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vVoxelLocalPosition = position;
         vVoxelSeed = dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719));`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         varying vec3 vVoxelLocalPosition;
         varying float vVoxelSeed;
         float voxelHash(float value) {
           return fract(sin(value) * 43758.5453);
         }`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         float voxelGrain = voxelHash(vVoxelSeed + vVoxelLocalPosition.x * 7.0 + vVoxelLocalPosition.y * 11.0 + vVoxelLocalPosition.z * 13.0);
         float voxelEdge = smoothstep(0.29, 0.43, max(max(abs(vVoxelLocalPosition.x), abs(vVoxelLocalPosition.y)), abs(vVoxelLocalPosition.z)));
         float voxelTop = smoothstep(0.02, 0.42, vVoxelLocalPosition.y);
         diffuseColor.rgb *= 0.965 + voxelGrain * 0.055;
         diffuseColor.rgb *= 1.0 - voxelEdge * 0.035;
         diffuseColor.rgb += voxelTop * 0.015;`
      );
  }, []);

  if (quality === "reduced") {
    return (
      <meshLambertMaterial
        transparent={ghost}
        opacity={ghost ? 0.34 : 1}
        depthWrite={!ghost}
        onBeforeCompile={patchShader}
        customProgramCacheKey={() => "voxels-reduced-v1"}
      />
    );
  }

  return (
    <meshStandardMaterial
      roughness={ghost ? 0.82 : 0.7}
      roughnessMap={ghost ? undefined : detailTexture}
      metalness={0}
      bumpMap={ghost ? undefined : detailTexture}
      bumpScale={ghost ? 0 : 0.018}
      transparent={ghost}
      opacity={ghost ? 0.34 : 1}
      depthWrite={!ghost}
      onBeforeCompile={patchShader}
      customProgramCacheKey={() => "voxels-clay-v1"}
    />
  );
}
