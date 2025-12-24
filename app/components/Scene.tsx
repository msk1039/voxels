"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VoxelScene } from "./VoxelScene";
import { Floor } from "./Floor";
import { VoxelData } from "./types";

interface SceneProps {
  equation: string;
  version: number;
  onHover?: (voxel: VoxelData | null, screenPos: { x: number; y: number } | null) => void;
}

export function Scene({ equation, version, onHover }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [20, 20, 20], fov: 50, near: 0.1, far: 1000 }}
    >
      <color attach="background" args={["#f0f4f8"]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      
      {/* Scene objects */}
      <VoxelScene equation={equation} version={version} onHover={onHover} />
      <Floor />
      
      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={100}
      />
    </Canvas>
  );
}
