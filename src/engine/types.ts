import type { FilmOptionId, FormatId, Style, VariantId } from "../concepts/types";

export type EngineCapability = "grade" | "segment" | "prompt" | "identity";
export interface PreparedPhoto { bitmap: ImageBitmap; width: number; height: number; }
export interface RenderRequest { style: Style; variant: VariantId; options: ReadonlySet<FilmOptionId>; year: number | null; yearRange?: { min: number; max: number }; format: FormatId; title: string; quality: "preview" | "export"; }
export interface RenderResult { blob: Blob; width: number; height: number; }
export interface ImageEngine { id: string; capabilities: ReadonlySet<EngineCapability>; prepare(photo: Blob): Promise<PreparedPhoto>; render(prepared: PreparedPhoto, request: RenderRequest): Promise<RenderResult>; dispose(prepared: PreparedPhoto): void; }
