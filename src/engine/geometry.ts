import type { FormatId } from "../concepts/types";

const RATIO: Record<FormatId, [number, number]> = { post: [4, 5], kare: [1, 1], story: [9, 16] };

/** Long edge equals maxEdge; the other edge follows the format ratio. */
export function outputSize(format: FormatId, maxEdge: number): { width: number; height: number } {
  const [w, h] = RATIO[format];
  return w >= h
    ? { width: maxEdge, height: Math.round((maxEdge * h) / w) }
    : { width: Math.round((maxEdge * w) / h), height: maxEdge };
}

/** Largest centered source rectangle matching the destination aspect ratio. */
export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const dstAspect = dstW / dstH;
  if (srcW / srcH > dstAspect) {
    const w = srcH * dstAspect;
    return { x: (srcW - w) / 2, y: 0, w, h: srcH };
  }
  const h = srcW / dstAspect;
  return { x: 0, y: (srcH - h) / 2, w: srcW, h };
}
