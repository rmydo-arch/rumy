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

  async function attempt(prepared: PreparedPhoto, request: RenderRequest): Promise<RenderResult | null> {
    if (!renderer || renderer.isDead) renderer = new GlRenderer(makeCanvas());
    const r = renderer;
    const { width, height } = outputSize(request.format, request.quality === "export" ? MAX_EXPORT_EDGE : MAX_PREVIEW_EDGE);
    const crop = coverCrop(prepared.width, prepared.height, width, height);
    const grade = resolveGrade(request.style.grade, request.variant, request.options, request.year, request.yearRange);
    r.draw(prepared.bitmap, crop, width, height, grade);
    if (r.isDead) return null;
    let blob: Blob;
    try {
      blob = await toJpeg(r.canvas);
    } catch (e) {
      if (r.isDead) return null;
      throw e;
    }
    // a context lost mid-draw or mid-toBlob yields a blank JPEG, so never trust it
    if (r.isDead) return null;
    return { blob, width, height };
  }

  async function run(prepared: PreparedPhoto, request: RenderRequest): Promise<RenderResult> {
    for (let i = 0; i < 2; i++) {
      const result = await attempt(prepared, request);
      if (result) return result;
    }
    throw new Error("webgl_context_lost");
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
      // queued so a pending render never meets a closed bitmap
      queue = queue.then(() => {
        renderer?.release(prepared.bitmap);
        prepared.bitmap.close();
      });
    },
  };
}
