export type ArtKind = "rings" | "sun" | "burst" | "bands" | "check" | "waves" | "dots" | "lines" | "frame";

/** CSS background string for card and style thumbnails (ported from the prototype). */
export function art(kind: ArtKind, a: string, b: string, c = "", d = ""): string {
  switch (kind) {
    case "rings": return `radial-gradient(circle at 50% 118%, ${a} 0 26%, ${b} 26% 50%, ${c} 50% 74%, ${d} 74%)`;
    case "sun": return `repeating-conic-gradient(from 0deg at 50% 100%, ${a} 0 12deg, ${b} 12deg 24deg)`;
    case "burst": return `repeating-conic-gradient(from 0deg at 50% 50%, ${a} 0 15deg, ${b} 15deg 30deg)`;
    case "bands": return `linear-gradient(115deg, ${a} 0 25%, ${b} 25% 50%, ${c} 50% 75%, ${d} 75%)`;
    case "check": return `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0) 0 0 / 24px 24px`;
    case "waves": return `repeating-radial-gradient(circle at 20% 30%, ${a} 0 12px, ${b} 12px 24px)`;
    case "dots": return `radial-gradient(${a} 34%, transparent 36%) 0 0 / 16px 16px, ${b}`;
    case "lines": return `repeating-linear-gradient(90deg, ${a} 0 3px, transparent 3px 26px), repeating-linear-gradient(0deg, ${a} 0 3px, transparent 3px 26px), ${b}`;
    case "frame": return `linear-gradient(${a} 0 0) center / 46% 62% no-repeat, ${b}`;
  }
}
