import { coverCrop, outputSize } from "./geometry";
import { resolveGrade } from "./grade";
import { GlRenderer } from "./gl/renderer";
import { MAX_EXPORT_EDGE, MAX_PREVIEW_EDGE } from "./limits";
import { decodePhoto } from "./photoFile";
import type { ImageEngine, PreparedPhoto, RenderRequest, RenderResult } from "./types";

export interface FilterEngineOptions { canvasFactory?: () => HTMLCanvasElement; }

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export_failed"))), "image/jpeg", 0.9),
  );
}

export function createFilterEngine(options: FilterEngineOptions = {}): ImageEngine {
  const makeCanvas = options.canvasFactory ?? (() => document.createElement("canvas"));
  let renderer: GlRenderer | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  async function run(prepared: PreparedPhoto, request: RenderRequest): Promise<RenderResult> {
    if (!renderer || renderer.isDead) renderer = new GlRenderer(makeCanvas());
    const { width, height } = outputSize(request.format, request.quality === "export" ? MAX_EXPORT_EDGE : MAX_PREVIEW_EDGE);
    const crop = coverCrop(prepared.width, prepared.height, width, height);
    const grade = resolveGrade(request.style.grade, request.variant, request.options, request.year, request.yearRange);
    renderer.draw(prepared.bitmap, crop, width, height, grade);
    return { blob: await toJpeg(renderer.canvas), width, height };
  }

  return {
    id: "filter",
    capabilities: new Set(["grade"]),
    async prepare(photo) {
      const bitmap = await decodePhoto(photo, MAX_EXPORT_EDGE);
      return { bitmap, width: bitmap.width, height: bitmap.height };
    },
    render(prepared, request) {
      const result = queue.then(() => run(prepared, request));
      queue = result.catch(() => undefined);
      return result;
    },
    dispose(prepared) {
      renderer?.release(prepared.bitmap);
      prepared.bitmap.close();
    },
  };
}
