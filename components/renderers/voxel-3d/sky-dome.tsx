"use client";

import { useMemo } from "react";
import { BackSide, Color } from "three";

export const SKY_COLORS = {
  zenith: "#4f93e0",
  horizon: "#b9dcfb",
  ground: "#8fb6d8",
} as const;

const SKY_VERTEX = /* glsl */ `
  varying vec3 vSkyDirection;
  void main() {
    vSkyDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Banded rather than smooth, so the sky reads as pixel art too.
const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  varying vec3 vSkyDirection;
  void main() {
    float h = vSkyDirection.y;
    float band = floor(clamp(h, 0.0, 1.0) * 10.0) / 10.0;
    vec3 sky = mix(uHorizon, uZenith, pow(band, 0.7));
    vec3 color = h < 0.0 ? mix(uHorizon, uGround, clamp(-h * 4.0, 0.0, 1.0)) : sky;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Blocky clouds: each is a few flat slabs on a 1-unit grid. */
const CLOUDS: Array<{ position: [number, number, number]; blocks: Array<[number, number, number]> }> = [
  { position: [-26, 11, -30], blocks: [[0, 0, 8], [3, 0, 5], [-2, 0.01, 4]] },
  { position: [24, 13, -22], blocks: [[0, 0, 7], [2, 0, 9], [-3, 0.01, 3]] },
  { position: [-30, 9, 18], blocks: [[0, 0, 6], [2, 0.01, 4]] },
  { position: [28, 10, 26], blocks: [[0, 0, 9], [-2, 0, 5], [4, 0.01, 4]] },
  { position: [2, 15, -40], blocks: [[0, 0, 10], [3, 0, 6], [-4, 0.01, 5]] },
];

export function SkyDome() {
  const uniforms = useMemo(
    () => ({
      uZenith: { value: new Color(SKY_COLORS.zenith) },
      uHorizon: { value: new Color(SKY_COLORS.horizon) },
      uGround: { value: new Color(SKY_COLORS.ground) },
    }),
    []
  );

  return (
    <group>
      <mesh renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[70, 24, 16]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          fog={false}
          uniforms={uniforms}
          vertexShader={SKY_VERTEX}
          fragmentShader={SKY_FRAGMENT}
        />
      </mesh>
      {CLOUDS.map((cloud, index) => (
        <group key={index} position={cloud.position}>
          {cloud.blocks.map(([x, y, width], blockIndex) => (
            <mesh key={blockIndex} position={[x * 2, y, blockIndex * 2.2 - 2]}>
              <boxGeometry args={[width * 2, 1, 4]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.88} fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
