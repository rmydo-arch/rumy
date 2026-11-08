import type { Shelf } from "./types";

export function validateCatalog(shelves: Shelf[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const shelf of shelves) {
    for (const concept of shelf.concepts) {
      if (seen.has(concept.id)) errors.push(`${concept.id}: yinelenen id`);
      seen.add(concept.id);
      if (concept.status !== "live") continue;
      const categories = new Set(concept.categories.map((c) => c.id));
      const styleIds = new Set<string>();
      for (const style of concept.styles) {
        const ref = `${concept.id}/${style.id}`;
        if (styleIds.has(style.id)) errors.push(`${ref}: yinelenen id`);
        styleIds.add(style.id);
        if (!categories.has(style.categoryId)) errors.push(`${ref}: kategori yok`);
        if (style.kind === "scene" && !style.sceneAsset) errors.push(`${ref}: sceneAsset eksik`);
        if (style.kind === "template" && !style.template) errors.push(`${ref}: template eksik`);
      }
    }
  }
  return errors;
}
