"use client";

import { ContactShadows, Environment, Grid, Lightformer } from "@react-three/drei";

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

      <mesh position={[0, -5.55, 0]} receiveShadow>
        <boxGeometry args={[25, 0.12, 25]} />
        <meshStandardMaterial color="#dce3e7" roughness={0.94} />
      </mesh>
      <Grid
        position={[0, -5.485, 0]}
        args={[24, 24]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#aebbc3"
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor="#8f9ea8"
        fadeDistance={18}
        fadeStrength={1}
        infiniteGrid={false}
      />
      <ContactShadows
        position={[0, -5.46, 0]}
        scale={22}
        far={18}
        opacity={high ? 0.42 : 0.25}
        blur={high ? 2.2 : 1.6}
        resolution={high ? 1024 : 256}
        frames={high ? 40 : 1}
        color="#44515a"
      />
    </>
  );
}
