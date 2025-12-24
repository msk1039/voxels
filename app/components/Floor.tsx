"use client";

export function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#e8e8e8" />
    </mesh>
  );
}
