"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

interface ActivityFrameLoopProps {
  active: boolean;
  fps: 30 | 60;
  renderSignal: unknown;
  visible: boolean;
}

export function ActivityFrameLoop({
  active,
  fps,
  renderSignal,
  visible,
}: ActivityFrameLoopProps) {
  const advance = useThree((state) => state.advance);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useEffect(() => {
    if (!visible || active) return;
    advance(window.performance.now() / 1000);
  }, [active, advance, height, renderSignal, visible, width]);

  useEffect(() => {
    if (!active || !visible) return;

    const interval = 1000 / fps;
    let frame = 0;
    let lastFrame = 0;

    function tick(time: number) {
      if (lastFrame === 0 || time - lastFrame >= interval - 0.5) {
        lastFrame = time;
        advance(time / 1000);
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, advance, fps, visible]);

  return null;
}
