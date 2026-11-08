// Dev-only harness for e2e/engine.spec.ts. Served by the Vite dev server, not part of the production build.
import type { FilmOptionId, FormatId, GradeSettings, Style, VariantId } from "../concepts/types";
import { createFilterEngine } from "../engine/filterEngine";
import type { PreparedPhoto } from "../engine/types";

const grade: GradeSettings = { saturation: 1, contrast: 1, brightness: 1, warmth: 0, fade: 0, grain: 0.16, vignette: 0, leak: 0, mono: false };
const style: Style = { id: "t", categoryId: "t", name: "t", thumbnail: "", kind: "filter", grade };

let glCanvas: HTMLCanvasElement | null = null;
const engine = createFilterEngine({
  canvasFactory: () => (glCanvas = document.createElement("canvas")),
});

async function testImage(): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 800;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, "#d04020");
  grad.addColorStop(0.5, "#40a060");
  grad.addColorStop(1, "#2040c0");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1200, 800);
  g.fillStyle = "#f0e0a0";
  g.beginPath();
  g.arc(600, 400, 200, 0, Math.PI * 2);
  g.fill();
  return new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
}

let prepared: Promise<PreparedPhoto> | null = null;

interface Opts { variant?: VariantId; format?: FormatId; quality?: "preview" | "export"; options?: FilmOptionId[]; }

async function renderBlob(o: Opts = {}) {
  prepared ??= testImage().then((b) => engine.prepare(b));
  return engine.render(await prepared, {
    style,
    variant: o.variant ?? "ozgun",
    options: new Set(o.options ?? []),
    year: null,
    format: o.format ?? "post",
    title: "",
    quality: o.quality ?? "preview",
  });
}

async function pixels(blob: Blob) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  const g = c.getContext("2d")!;
  g.drawImage(bmp, 0, 0);
  return g.getImageData(0, 0, c.width, c.height).data;
}

const harness = {
  async render(o?: Opts) {
    const r = await renderBlob(o);
    return { width: r.width, height: r.height, type: r.blob.type };
  },
  async renderHash(variant: VariantId) {
    const d = await pixels((await renderBlob({ variant })).blob);
    let h = 2166136261;
    for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619) >>> 0;
    return h;
  },
  async renderNonBlank() {
    const d = await pixels((await renderBlob()).blob);
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const v = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return max - min > 20 && max > 20;
  },
  async loseContext() {
    await harness.render(); // make sure a context exists
    const canvas = glCanvas!;
    const lost = new Promise<void>((res) => canvas.addEventListener("webglcontextlost", () => res(), { once: true }));
    const ext = (canvas.getContext("webgl2") as WebGL2RenderingContext).getExtension("WEBGL_lose_context");
    if (!ext) throw new Error("no WEBGL_lose_context");
    ext.loseContext();
    await lost;
  },
};

(window as unknown as { harness: typeof harness }).harness = harness;
document.title = "ready";
