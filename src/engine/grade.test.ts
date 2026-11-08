import { describe, expect, it } from "vitest";
import type { GradeSettings } from "../concepts/types";
import { dateStamp, resolveGrade } from "./grade";
import { coverCrop, outputSize } from "./geometry";

const base: GradeSettings = { saturation: 1, contrast: 1, brightness: 1, warmth: 0, fade: 0, grain: 0.16, vignette: 0, leak: 0, mono: false };

describe("resolveGrade", () => {
  it("Solgun doygunluğu ve kontrastı düşürür", () => {
    const g = resolveGrade(base, "solgun", new Set(), null);
    expect(g.saturation).toBeCloseTo(0.8);
    expect(g.contrast).toBeCloseTo(0.88);
    expect(g.fade).toBeCloseTo(0.15);
  });
  it("Canlı doygunluğu artırır", () => {
    const g = resolveGrade(base, "canli", new Set(), null);
    expect(g.saturation).toBeCloseTo(1.25);
    expect(g.contrast).toBeCloseTo(1.08);
  });
  it("Özgün hiçbir şeyi değiştirmez", () => expect(resolveGrade(base, "ozgun", new Set(), null)).toEqual(base));
  it("gren seçeneği en az .32 yapar", () =>
    expect(resolveGrade(base, "ozgun", new Set(["grain"]), null).grain).toBeCloseTo(0.32));
  it("diğer seçenekler", () => {
    const g = resolveGrade(base, "ozgun", new Set(["leak", "fade", "orangeShift", "vignette"]), null);
    expect([g.leak, g.fade, g.warmth, g.vignette]).toEqual([0.6, 0.15, 0.1, 0.4]);
  });
  it("1970 daha sıcak, 1979 daha serin", () => {
    const r = { min: 1970, max: 1979 };
    expect(resolveGrade(base, "ozgun", new Set(), 1970, r).warmth).toBeCloseTo(0.06);
    expect(resolveGrade(base, "ozgun", new Set(), 1979, r).warmth).toBeCloseTo(-0.06);
  });
});

describe("geometry", () => {
  it("format boyutları", () => {
    expect(outputSize("post", 2048)).toEqual({ width: 1638, height: 2048 });
    expect(outputSize("kare", 2048)).toEqual({ width: 2048, height: 2048 });
    expect(outputSize("story", 2048)).toEqual({ width: 1152, height: 2048 });
  });
  it("aşırı geniş fotoğraf ortadan kırpılır", () => {
    const c = coverCrop(8000, 1000, 1638, 2048);
    expect(c.h).toBe(1000);
    expect(c.w).toBeCloseTo(799.8, 0);
    expect(c.x).toBeCloseTo(3600.1, 0);
  });
  it("aşırı uzun fotoğraf dikeyde kırpılır", () => {
    const c = coverCrop(1000, 8000, 1000, 1000);
    expect([c.x, c.y, c.w, c.h]).toEqual([0, 3500, 1000, 1000]);
  });
});

it("tarih damgası", () => expect(dateStamp(1977)).toBe("'77 08 14"));
