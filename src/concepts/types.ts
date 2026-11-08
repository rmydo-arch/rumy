export type VariantId = "ozgun" | "solgun" | "canli";
export type FormatId = "post" | "kare" | "story";
export type FilmOptionId = "grain" | "leak" | "fade" | "orangeShift" | "vignette" | "dateStamp";
export interface GradeSettings { saturation: number; contrast: number; brightness: number; warmth: number; fade: number; grain: number; vignette: number; leak: number; mono: boolean; }
export interface TemplateSettings { asset: string; photoRect: [number, number, number, number]; titleRect: [number, number, number, number]; titleColor: string; lockedFormat?: FormatId; }
export interface Style { id: string; categoryId: string; name: string; thumbnail: string; kind: "filter" | "scene" | "template"; grade: GradeSettings; sceneAsset?: string; template?: TemplateSettings; frame?: "none" | "instant" | "super8" | "album"; promptSeed?: string; }
export interface ConceptCopy { uploadTitle: string; editTitle: string; cta: string; processingTitle: string; processingStages: string[]; resultTitle: (year: number | null) => string; }
export interface ConceptBase { id: string; name: string; sub: string; cardArt: string; }
export interface SoonConcept extends ConceptBase { status: "soon"; }
export interface LiveConcept extends ConceptBase { status: "live"; title: string; pitch: string; theme: { accent: string; stage: string }; copy: ConceptCopy; yearRange?: { min: number; max: number; default: number }; categories: { id: string; label: string }[]; styles: Style[]; }
export type Concept = LiveConcept | SoonConcept;
export interface Shelf { id: string; title: string; description: string; concepts: Concept[]; }
export interface Selection { conceptId: string; styleId: string; variant: VariantId; options: ReadonlySet<FilmOptionId>; year: number | null; format: FormatId; title: string; }
