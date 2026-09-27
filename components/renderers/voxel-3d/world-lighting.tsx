"use client";

import { RenderQuality } from "./types";

/**
 * Flat, bright daylight. The block shader already applies Minecraft-style
 * face shading and corner AO, so lighting only adds a gentle sun direction
 * and, on high quality, block shadows.
 *
 * Lambert divides by π, so an ambient + sun total near π shows top faces
 * at roughly their texture colour.
 */
export function WorldLighting({ quality }: { quality: RenderQuality }) {
  const high = quality === "high";

  return (
    <>
      <ambientLight intensity={2.1} />
      <hemisphereLight args={["#e4f1ff", "#8a7358", 0.5]} />
      <directionalLight
        castShadow={high}
        color="#fff4dc"
        intensity={1.3}
        position={[8, 14, 5]}
        shadow-mapSize-width={high ? 2048 : 768}
        shadow-mapSize-height={high ? 2048 : 768}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-intensity={0.55}
      />
    </>
  );
}
