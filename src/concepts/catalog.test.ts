import { describe, expect, it } from "vitest";
import { catalog, getLiveConcept } from "./catalog";
import { GRADES } from "./retro70";
import { validateCatalog } from "./validate";
import type { LiveConcept, Shelf, Style } from "./types";

function catalogWithSceneMissingAsset(): Shelf[] {
  const salon: Style = {
    id: "salon", kind: "scene", categoryId: "film", name: "Turuncu Salon", thumbnail: "",
    grade: getLiveConcept("retro-70")!.styles[0].grade,
  };
  return catalog.map((shelf) => ({
    ...shelf,
    concepts: shelf.concepts.map((c) => (c.id === "retro-70" && c.status === "live" ? { ...c, styles: [...c.styles, salon] } : c)),
  }));
}

describe("katalog", () => {
  it("katalog geçerli", () => expect(validateCatalog(catalog)).toEqual([]));
  it("Retro rafı on yıl sırasıyla", () =>
    expect(catalog[0].concepts.map((c) => c.name)).toEqual(["50'ler", "60'lar", "70'ler", "80'ler", "90'lar", "Y2K"]));
  it("12 ek konsept var", () => expect(catalog[1].concepts).toHaveLength(12));
  it("yalnızca retro-70 canlı", () =>
    expect(catalog.flatMap((s) => s.concepts).filter((c) => c.status === "live").map((c) => c.id)).toEqual(["retro-70"]));
  it("70'ler ilk sürümde 5 filtre ve 4 şablon içerir, sahne içermez", () => {
    const k = getLiveConcept("retro-70")!.styles.map((s) => s.kind);
    expect([k.filter((x) => x === "filter").length, k.filter((x) => x === "scene").length, k.filter((x) => x === "template").length]).toEqual([5, 0, 4]);
  });
  it("eksik sahne dosyası hatası verir", () => {
    expect(validateCatalog(catalogWithSceneMissingAsset())).toContain("retro-70/salon: sceneAsset eksik");
  });
  it("sonuç başlığı yıl ekini doğru seçer", () => {
    const { resultTitle } = getLiveConcept("retro-70")!.copy;
    expect([resultTitle(1977), resultTitle(1970), resultTitle(1976)]).toEqual(["1977'ye hoş geldin", "1970'e hoş geldin", "1976'ya hoş geldin"]);
  });

  it("retro-70 stilleri tam veriyle eşleşir", () => {
    const { warm, faded, slide, tinted, mono } = GRADES;
    const rows = [
      ["anlik", "Anlık Film", "filter", "film", "instant", faded],
      ["slayt", "Sıcak Slayt Filmi", "filter", "film", undefined, slide],
      ["super8", "Super 8 Karesi", "filter", "film", "super8", { ...warm, leak: 0.6 }],
      ["album", "Aile Albümü", "filter", "film", "album", faded],
      ["mahalle", "Mahalle Fotoğrafçısı", "filter", "film", undefined, tinted],
      ["plak", "Plak Kapağı", "template", "kapak", undefined, slide],
      ["yesilcam", "Yeşilçam Afişi", "template", "kapak", undefined, tinted],
      ["kaset", "Arabesk Kaset", "template", "kapak", undefined, tinted],
      ["punk", "Punk Fanzini", "template", "kapak", undefined, mono],
    ] as const;
    const styles = getLiveConcept("retro-70")!.styles;
    expect(styles.map((s) => s.id)).toEqual(rows.map((r) => r[0]));
    rows.forEach(([id, name, kind, categoryId, frame, grade], i) => {
      const s = styles[i];
      expect({ id: s.id, name: s.name, kind: s.kind, categoryId: s.categoryId, frame: s.frame, grade: s.grade })
        .toEqual({ id, name, kind, categoryId, frame, grade });
      expect(s.promptSeed).toBeTruthy();
      expect(s.thumbnail).toBeTruthy();
    });
    expect(GRADES.warm).toEqual({ saturation: 1.3, contrast: 0.94, brightness: 1.03, warmth: 0.32, fade: 0, grain: 0.16, vignette: 0, leak: 0, mono: false });
    expect(GRADES.mono).toEqual({ saturation: 0, contrast: 1.25, brightness: 1.02, warmth: 0, fade: 0, grain: 0.25, vignette: 0, leak: 0, mono: true });
  });

  it("şablon ayarları doğru", () => {
    const t = Object.fromEntries(getLiveConcept("retro-70")!.styles.filter((s) => s.kind === "template").map((s) => [s.id, s.template]));
    expect(t).toEqual({
      plak: { asset: "/templates/plak.svg", photoRect: [0.08, 0.08, 0.84, 0.7], titleRect: [0.08, 0.82, 0.84, 0.12], titleColor: "#1F1A17", lockedFormat: "kare" },
      yesilcam: { asset: "/templates/yesilcam.svg", photoRect: [0.08, 0.06, 0.84, 0.66], titleRect: [0.08, 0.76, 0.84, 0.16], titleColor: "#FFFBF2", lockedFormat: "post" },
      kaset: { asset: "/templates/kaset.svg", photoRect: [0.1, 0.1, 0.8, 0.62], titleRect: [0.1, 0.76, 0.8, 0.14], titleColor: "#FFFBF2", lockedFormat: "post" },
      punk: { asset: "/templates/punk.svg", photoRect: [0.06, 0.06, 0.88, 0.7], titleRect: [0.06, 0.8, 0.88, 0.14], titleColor: "#1F1A17", lockedFormat: "post" },
    });
  });

  it("metinler, tema ve yıl aralığı doğru", () => {
    const c = getLiveConcept("retro-70")!;
    expect({ title: c.title, pitch: c.pitch, theme: c.theme, yearRange: c.yearRange, categories: c.categories }).toEqual({
      title: "70'ler Retro",
      pitch: "Anlık film, plak kapağı, Yeşilçam afişi ve 6 stil daha.",
      theme: { accent: "#BF4316", stage: "#2B1A10" },
      yearRange: { min: 1970, max: 1979, default: 1977 },
      categories: [{ id: "film", label: "Film ve albüm" }, { id: "kapak", label: "Afiş ve kapak" }],
    });
    const { resultTitle, ...strings } = c.copy;
    expect(strings).toEqual({
      uploadTitle: "Hangi fotoğraf 70'lere gitsin?",
      editTitle: "70'lerin hangi köşesi?",
      cta: "70'lere gönder",
      processingTitle: "Karanlık odada banyo ediliyor",
      processingStages: ["Renkler döneme çekiliyor", "Film dokusu ekleniyor", "Çerçeve hazırlanıyor", "Son rötuşlar yapılıyor"],
    });
    expect(resultTitle(null)).toBe("70'lere hoş geldin");
  });

  describe("doğrulayıcı olumsuz durumlar", () => {
    const withRetro = (change: (c: LiveConcept) => LiveConcept): Shelf[] =>
      catalog.map((shelf) => ({
        ...shelf,
        concepts: shelf.concepts.map((c) => (c.id === "retro-70" && c.status === "live" ? change(c) : c)),
      }));

    it("şablon eksikse hata verir", () => {
      const shelves = withRetro((c) => ({ ...c, styles: c.styles.map((s) => (s.id === "plak" ? { ...s, template: undefined } : s)) }));
      expect(validateCatalog(shelves)).toEqual(["retro-70/plak: template eksik"]);
    });
    it("kategori yoksa hata verir", () => {
      const shelves = withRetro((c) => ({ ...c, styles: c.styles.map((s) => (s.id === "punk" ? { ...s, categoryId: "yok" } : s)) }));
      expect(validateCatalog(shelves)).toEqual(["retro-70/punk: kategori yok"]);
    });
    it("yinelenen stil id hata verir", () => {
      const shelves = withRetro((c) => ({ ...c, styles: [...c.styles, c.styles[0]] }));
      expect(validateCatalog(shelves)).toEqual(["retro-70/anlik: yinelenen id"]);
    });
    it("yinelenen konsept id hata verir", () => {
      const shelves = catalog.map((s, i) => (i === 1 ? { ...s, concepts: [...s.concepts, { ...s.concepts[0] }] } : s));
      expect(validateCatalog(shelves)).toEqual([`${catalog[1].concepts[0].id}: yinelenen id`]);
    });
  });
});
