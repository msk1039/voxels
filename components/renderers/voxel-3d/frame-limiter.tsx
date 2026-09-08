"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function FrameLimiter({ fps }: { fps: 30 | 60 }) {
  const advance = useThree((state) => state.advance);

  useEffect(() => {
    const interval = 1000 / fps;
    let frame = 0;
    let lastFrame = 0;

    function tick(time: number) {
      if (lastFrame === 0 || time - lastFrame >= interval - 0.5) {
        lastFrame = time;
        advance(time);
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [advance, fps]);

  return null;
}
