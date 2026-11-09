import { describe, expect, it } from "vitest";
import type { FilmOptionId, Style, TemplateSettings } from "../concepts/types";
import { clampTitle, fitFontSize, layoutFor } from "./compose";
import type { RenderRequest } from "./types";

const grade = { saturation: 1, contrast: 1, brightness: 1, warmth: 0, fade: 0, grain: 0, vignette: 0, leak: 0, mono: false };
const template: TemplateSettings = { asset: "/templates/x.svg", photoRect: [0.1, 0.2, 0.5, 0.25], titleRect: [0.1, 0.8, 0.8, 0.1], titleColor: "#000" };

function req(style: Partial<Style>, options: FilmOptionId[] = [], year: number | null = 1977): RenderRequest {
  return { style: { id: "s", categoryId: "c", name: "s", thumbnail: "", kind: "filter", grade, ...style }, variant: "ozgun", options: new Set(options), year, format: "kare", title: "", quality: "preview" };
}

describe("clampTitle", () => {
  it("başlık 30 karaktere kırpılır ve boşlukları temizlenir", () => expect(clampTitle("  " + "ş".repeat(40))).toHaveLength(30));
  it("kısa başlığın kenar boşluklarını siler", () => expect(clampTitle("  Şarkılar ")).toBe("Şarkılar"));
});

describe("layoutFor", () => {
  it("çerçevesiz filtre birleştirme gerektirmez", () => expect(layoutFor(req({}), 1000, 1000)).toBeNull());
  it("yıl olmadan damga seçeneği birleştirme gerektirmez", () => expect(layoutFor(req({}, ["dateStamp"], null), 1000, 1000)).toBeNull());
  it("damga seçeneği fotoğrafı tam alanda bırakır", () => {
    expect(layoutFor(req({}, ["dateStamp"]), 1000, 800)).toMatchObject({ photo: { x: 0, y: 0, w: 1000, h: 800 }, stamp: true, title: null });
  });
  it("şablon alanları oranlardan piksele çevrilir", () => {
    expect(layoutFor(req({ kind: "template", template }), 1000, 2000)).toMatchObject({
      photo: { x: 100, y: 400, w: 500, h: 500 },
      title: { x: 100, y: 1600, w: 800, h: 200 },
      stamp: false,
    });
  });
  it("çerçeveli stil damga taşır", () => expect(layoutFor(req({ frame: "album" }), 1000, 1000)?.stamp).toBe(true));
  it("anlık çerçevenin alt kenarı üstten kalındır", () => {
    const { photo } = layoutFor(req({ frame: "instant" }), 1000, 1250)!;
    expect(1250 - (photo.y + photo.h)).toBeGreaterThan(photo.y);
    expect(photo.x).toBe(photo.y);
  });
  it("Super 8 yalnızca yanlardan keser", () => {
    const { photo } = layoutFor(req({ frame: "super8" }), 1000, 1250)!;
    expect(photo.x).toBeGreaterThan(0);
    expect([photo.y, photo.h]).toEqual([0, 1250]);
    expect(photo.x * 2 + photo.w).toBe(1000);
  });
});

describe("fitFontSize", () => {
  const measure = (size: number) => size * 10;
  it("kısa metin kutu yüksekliğine ulaşır", () => expect(fitFontSize(measure, 1000, 40)).toBe(40));
  it("uzun metin genişliğe sığacak kadar küçülür", () => expect(fitFontSize(measure, 200, 40)).toBe(20));
});
