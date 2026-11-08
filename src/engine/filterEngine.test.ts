import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Style } from "../concepts/types";
import type { PreparedPhoto, RenderRequest } from "./types";

const state = vi.hoisted(() => ({ made: [] as { dead: boolean; deadAfterDraws: number; draws: number }[], events: [] as string[] }));

vi.mock("./gl/renderer", () => ({
  GlRenderer: class {
    canvas = { toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(["x"], { type: "image/jpeg" })) };
    s = { dead: false, deadAfterDraws: Infinity, draws: 0 };
    constructor() { state.made.push(this.s); }
    get isDead() { return this.s.dead || this.s.draws > this.s.deadAfterDraws; }
    draw(bitmap: { closed: boolean }) {
      if (bitmap.closed) throw new Error("closed bitmap");
      this.s.draws++;
      state.events.push("draw");
    }
    release() {}
  },
}));

import { createFilterEngine } from "./filterEngine";

const style = { grade: { saturation: 1, contrast: 1, brightness: 1, warmth: 0, fade: 0, grain: 0, vignette: 0, leak: 0, mono: false } } as Style;
const req: RenderRequest = { style, variant: "ozgun", options: new Set(), year: null, format: "kare", title: "", quality: "preview" };
const photo = () => {
  const bitmap = { closed: false, width: 100, height: 100, close() { this.closed = true; } };
  return { bitmap, width: 100, height: 100 } as unknown as PreparedPhoto & { bitmap: { closed: boolean } };
};

beforeEach(() => { state.made.length = 0; state.events.length = 0; });

describe("filterEngine", () => {
  it("dispose sıraya girer: bekleyen işlem kapanmış bitmap görmez", async () => {
    const engine = createFilterEngine();
    const p = photo();
    const pending = engine.render(p, req);
    engine.dispose(p);
    await expect(pending).resolves.toMatchObject({ width: 720, height: 720 });
    expect(p.bitmap.closed).toBe(true);
  });

  it("işlem sırasında bağlam kaybolursa yeniden kurup bir kez dener", async () => {
    const engine = createFilterEngine();
    const p = photo();
    await engine.render(p, req);
    state.made[0].deadAfterDraws = 1; // dies right after the next draw
    await expect(engine.render(p, req)).resolves.toBeDefined();
    expect(state.made).toHaveLength(2);
  });

  it("iki kez kaybolursa webgl_context_lost fırlatır", async () => {
    const engine = createFilterEngine();
    const p = photo();
    await engine.render(p, req);
    state.made[0].dead = true;
    // every renderer built from now on dies after its first draw
    const orig = state.made.push.bind(state.made);
    state.made.push = (...s) => { s.forEach((x) => (x.deadAfterDraws = 0)); return orig(...s); };
    await expect(engine.render(p, req)).rejects.toThrow("webgl_context_lost");
  });
});
