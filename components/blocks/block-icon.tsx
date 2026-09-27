import { getBlock } from "@/lib/blocks";
import { getTileDataUrl } from "@/lib/block-atlas";
import { cn } from "@/lib/utils";

interface BlockIconProps {
  material: number | "glass";
  variant?: "cube" | "flat";
  className?: string;
  /** Accessible name. Pass "" when the icon is purely decorative. */
  title?: string;
}

/**
 * A block drawn from the procedural atlas: either an isometric cube (the
 * default) or a single flat face. The tiles are data URLs, so this renders
 * the same on the server and the client.
 */
export function BlockIcon({
  material,
  variant = "cube",
  className,
  title,
}: BlockIconProps) {
  const label =
    title ?? (material === "glass" ? "Glass" : getBlock(material).name);
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true as const };

  if (variant === "flat") {
    return (
      <svg
        viewBox="0 0 16 16"
        {...a11y}
        className={cn("pixelated shrink-0", className)}
      >
        <image
          href={getTileDataUrl(material, "top")}
          width="16"
          height="16"
          style={{ imageRendering: "pixelated" }}
        />
      </svg>
    );
  }

  const top = getTileDataUrl(material, "top");
  const side = getTileDataUrl(material, "side");
  return (
    <svg
      viewBox="0 0 32 32"
      {...a11y}
      shapeRendering="crispEdges"
      className={cn("shrink-0 overflow-visible", className)}
    >
      <g style={{ imageRendering: "pixelated" }}>
        {/* Top face: the unit square skewed onto the upper diamond. */}
        <image href={top} width="16" height="16" transform="matrix(1 -0.5 1 0.5 0 8)" />
        {/* Left and right faces, with fixed face shading on top. */}
        <image href={side} width="16" height="16" transform="matrix(1 0.5 0 1 0 8)" />
        <image href={side} width="16" height="16" transform="matrix(1 -0.5 0 1 16 16)" />
      </g>
      <polygon points="0,8 16,16 16,32 0,24" fill="black" opacity="0.2" />
      <polygon points="16,16 32,8 32,24 16,32" fill="black" opacity="0.38" />
    </svg>
  );
}
