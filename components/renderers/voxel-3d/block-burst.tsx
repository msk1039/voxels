"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";

import { Cell } from "@/lib/grid";

import { BlockMaterial } from "./block-material";

export const BURST_DURATION_S = 1.4;
const PARTICLES = 72;
const GRAVITY = -22;
const SIZE = 0.28;

interface Particle {
  origin: Vector3;
  velocity: Vector3;
  spin: Vector3;
}

const matrix = new Matrix4();
const position = new Vector3();
const scale = new Vector3();
const rotation = new Quaternion();
const euler = new Euler();

/** Seeded so a given burst id always throws the same shards. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Small block shards that pop out of the finished shape when a level is
 * cleared, then fall and shrink away.
 */
export function BlockBurst({ burstId, cells }: { burstId: number; cells: Cell[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const start = useRef<number | null>(null);

  const { particles, geometry } = useMemo(() => {
    const next = random(burstId * 7919 + cells.length);
    const source = cells.length > 0 ? cells : [{ x: 0, y: 0, z: 0, material: 1 }];
    const picked = Array.from(
      { length: PARTICLES },
      () => source[Math.floor(next() * source.length)]
    );
    const shards: Particle[] = picked.map((cell) => ({
      origin: new Vector3(cell.x, cell.y + 0.5, cell.z),
      velocity: new Vector3((next() - 0.5) * 7, 5 + next() * 6, (next() - 0.5) * 7),
      spin: new Vector3(next() * 8, next() * 8, next() * 8),
    }));
    const box = new BoxGeometry(SIZE, SIZE, SIZE);
    box.setAttribute(
      "aBlock",
      new InstancedBufferAttribute(Float32Array.from(picked, (cell) => cell.material), 1)
    );
    box.setAttribute(
      "aNeighbors",
      new InstancedBufferAttribute(new Float32Array(PARTICLES * 2), 2)
    );
    return { particles: shards, geometry: box };
  }, [burstId, cells]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useLayoutEffect(() => {
    start.current = null;
    const current = mesh.current;
    if (!current) return;
    // Hidden until the first animated frame.
    matrix.makeScale(0, 0, 0);
    for (let index = 0; index < PARTICLES; index += 1) current.setMatrixAt(index, matrix);
    current.instanceMatrix.needsUpdate = true;
  }, [particles]);

  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) return;
    const now = clock.getElapsedTime();
    start.current ??= now;
    const t = now - start.current;
    if (t > BURST_DURATION_S) {
      current.visible = false;
      return;
    }
    current.visible = true;
    const life = 1 - t / BURST_DURATION_S;
    particles.forEach((particle, index) => {
      position.set(
        particle.origin.x + particle.velocity.x * t,
        particle.origin.y + particle.velocity.y * t + 0.5 * GRAVITY * t * t,
        particle.origin.z + particle.velocity.z * t
      );
      euler.set(particle.spin.x * t, particle.spin.y * t, particle.spin.z * t);
      rotation.setFromEuler(euler);
      // Shrink in steps, like the block pop animation.
      scale.setScalar(Math.ceil(life * 4) / 4);
      matrix.compose(position, rotation, scale);
      current.setMatrixAt(index, matrix);
    });
    current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, PARTICLES]}
      geometry={geometry}
      frustumCulled={false}
      visible={false}
    >
      <BlockMaterial appearance="material" quality="reduced" />
    </instancedMesh>
  );
}
