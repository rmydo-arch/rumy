import type { FilmOptionId, GradeSettings, VariantId } from "../concepts/types";

export function resolveGrade(
  base: GradeSettings,
  variant: VariantId,
  options: ReadonlySet<FilmOptionId>,
  year: number | null,
  yearRange?: { min: number; max: number },
): GradeSettings {
  const g: GradeSettings = { ...base };
  if (variant === "solgun") {
    g.saturation *= 0.8;
    g.contrast *= 0.88;
    g.fade += 0.15;
  } else if (variant === "canli") {
    g.saturation *= 1.25;
    g.contrast *= 1.08;
  }
  if (options.has("grain")) g.grain = Math.max(g.grain, 0.32);
  if (options.has("leak")) g.leak = Math.max(g.leak, 0.6);
  if (options.has("fade")) g.fade += 0.15;
  if (options.has("orangeShift")) g.warmth += 0.1;
  if (options.has("vignette")) g.vignette = Math.max(g.vignette, 0.4);
  if (year !== null && yearRange && yearRange.max > yearRange.min) {
    const t = (year - yearRange.min) / (yearRange.max - yearRange.min);
    g.warmth += 0.06 - 0.12 * t;
    g.fade += 0.05 * (1 - t);
  }
  return g;
}

export function dateStamp(year: number): string {
  return `'${String(year % 100).padStart(2, "0")} 08 14`;
}
