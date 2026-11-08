import { describe, expect, it } from "vitest";
import { catalog, getLiveConcept } from "./catalog";
import { validateCatalog } from "./validate";
import type { Shelf, Style } from "./types";

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
});
