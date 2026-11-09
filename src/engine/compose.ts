import { dateStamp } from "./grade";
import type { RenderRequest } from "./types";

export interface Box { x: number; y: number; w: number; h: number; }
export interface Layout { photo: Box; title: Box | null; stamp: boolean; }

const MAX_TITLE = 30;
const TITLE_FONT = "900 100px Fraunces";
const FRAME_COLOR = { instant: "#FBF7EC", album: "#E9D9B4", super8: "#141110" } as const;

export function clampTitle(text: string): string {
  return [...text.trim()].slice(0, MAX_TITLE).join("").trim();
}

function rectToBox([x, y, w, h]: [number, number, number, number], width: number, height: number): Box {
  return { x: Math.round(x * width), y: Math.round(y * height), w: Math.round(w * width), h: Math.round(h * height) };
}

function framedBox(frame: keyof typeof FRAME_COLOR, width: number, height: number): Box {
  if (frame === "super8") {
    const side = Math.round(width * 0.1);
    return { x: side, y: 0, w: width - 2 * side, h: height };
  }
  const margin = Math.round(width * (frame === "instant" ? 0.06 : 0.07));
  const bottom = frame === "instant" ? Math.round(height * 0.16) : margin;
  return { x: margin, y: margin, w: width - 2 * margin, h: height - margin - bottom };
}

function frameOf(request: RenderRequest) {
  const { frame } = request.style;
  return frame && frame !== "none" ? frame : null;
}

/** Where each layer goes, or null when the WebGL output can be used as is. */
export function layoutFor(request: RenderRequest, width: number, height: number): Layout | null {
  const { style, options, year } = request;
  const frame = frameOf(request);
  const stamp = year !== null && (frame !== null || options.has("dateStamp"));
  if (style.kind === "template" && style.template) {
    return {
      photo: rectToBox(style.template.photoRect, width, height),
      title: rectToBox(style.template.titleRect, width, height),
      stamp,
    };
  }
  if (frame) return { photo: framedBox(frame, width, height), title: null, stamp };
  if (stamp) return { photo: { x: 0, y: 0, w: width, h: height }, title: null, stamp };
  return null;
}

/** Largest size that fits the box; text width grows linearly with font size. */
export function fitFontSize(measure: (size: number) => number, maxWidth: number, maxHeight: number): number {
  const width = measure(maxHeight);
  return Math.floor(width > maxWidth ? (maxHeight * maxWidth) / width : maxHeight);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("template_load_failed"));
    img.src = src;
  });
}

/** Caches decoded template images; a failed load is retried on the next render. */
export function createTemplateLoader() {
  const cache = new Map<string, Promise<HTMLImageElement>>();
  return (asset: string) => {
    let image = cache.get(asset);
    if (!image) {
      image = loadImage(asset);
      cache.set(asset, image);
      image.catch(() => cache.delete(asset));
    }
    return image;
  };
}

/** Canvas text silently uses a fallback until the face is loaded. A failed load keeps that fallback. */
export async function loadTitleFont(title: string): Promise<void> {
  if (title) await document.fonts.load(TITLE_FONT, title).catch(() => undefined);
}

function drawFrame(ctx: CanvasRenderingContext2D, frame: keyof typeof FRAME_COLOR, photo: Box, width: number, height: number) {
  ctx.fillStyle = FRAME_COLOR[frame];
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.rect(photo.x, photo.y, photo.w, photo.h);
  ctx.fill("evenodd");
  if (frame === "album") {
    ctx.strokeStyle = "#B89B63";
    ctx.lineWidth = Math.max(1, Math.round(width * 0.003));
    ctx.strokeRect(photo.x, photo.y, photo.w, photo.h);
  }
  if (frame === "super8") {
    const holeW = Math.round(photo.x * 0.5);
    const holeH = Math.round(holeW * 1.3);
    const step = holeH * 2;
    ctx.fillStyle = "#F7F1E4";
    for (let y = Math.round(holeH / 2); y < height; y += step) {
      for (const x of [Math.round((photo.x - holeW) / 2), width - Math.round((photo.x + holeW) / 2)]) {
        ctx.beginPath();
        ctx.roundRect(x, y, holeW, holeH, Math.round(holeW * 0.2));
        ctx.fill();
      }
    }
  }
}

function drawTitle(ctx: CanvasRenderingContext2D, text: string, box: Box, color: string) {
  const font = (size: number) => `900 ${size}px Fraunces, serif`;
  const size = fitFontSize((s) => {
    ctx.font = font(s);
    return ctx.measureText(text).width;
    // İ's dot and Ş's cedilla reach past the em box, so leave them room
  }, box.w, box.h * 0.8);
  ctx.font = font(size);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, box.x + box.w / 2, box.y + box.h / 2);
}

function drawStamp(ctx: CanvasRenderingContext2D, year: number, photo: Box) {
  ctx.font = `700 ${Math.round(photo.w * 0.05)}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = "#FF8A2A";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(dateStamp(year), photo.x + photo.w * 0.95, photo.y + photo.h * 0.96);
}

/** Paints template, photo, frame, title and date stamp, in that order. */
export function drawComposite(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  request: RenderRequest,
  photo: CanvasImageSource,
  template: CanvasImageSource | null,
) {
  const { width, height } = ctx.canvas;
  if (template) ctx.drawImage(template, 0, 0, width, height);
  ctx.drawImage(photo, layout.photo.x, layout.photo.y, layout.photo.w, layout.photo.h);
  const frame = frameOf(request);
  if (frame) drawFrame(ctx, frame, layout.photo, width, height);
  const title = clampTitle(request.title);
  if (layout.title && title && request.style.template) drawTitle(ctx, title, layout.title, request.style.template.titleColor);
  if (layout.stamp && request.year !== null) drawStamp(ctx, request.year, layout.photo);
}
