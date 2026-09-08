"use client";

import { Environment, Lightformer } from "@react-three/drei";

import { RenderQuality } from "./types";

export function WorldLighting({ quality }: { quality: RenderQuality }) {
  const high = quality === "high";

  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#dbeeff", "#876f59", 1.2]} />
      <directionalLight
        castShadow
        color="#fff0d5"
        intensity={2.5}
        position={[8, 13, 7]}
        shadow-mapSize-width={high ? 2048 : 768}
        shadow-mapSize-height={high ? 2048 : 768}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-bias={-0.0004}
      />
      {high ? (
        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={3.5}
            color="#ffe2b6"
            position={[-6, 8, 6]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[8, 8, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2.2}
            color="#b9d8ff"
            position={[7, 3, -6]}
            rotation={[0, -Math.PI / 3, 0]}
            scale={[7, 7, 1]}
          />
          <Lightformer
            form="ring"
            intensity={1.5}
            color="#ffffff"
            position={[0, 10, -4]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={5}
          />
        </Environment>
      ) : null}
    </>
  );
}
