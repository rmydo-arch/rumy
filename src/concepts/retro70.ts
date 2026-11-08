import { art } from "./art";
import type { GradeSettings, LiveConcept, Style, TemplateSettings } from "./types";

const O = "#D9541E", G = "#E8A317", B = "#3B2314", C = "#F4E7CF", T = "#2F7C7A", M = "#7A2E4E", R = "#8C3A16", K = "#1F1A17";

const base = { vignette: 0, leak: 0 };
export const GRADES = {
  warm: { saturation: 1.3, contrast: 0.94, brightness: 1.03, warmth: 0.32, fade: 0, grain: 0.16, mono: false, ...base },
  faded: { saturation: 0.85, contrast: 0.84, brightness: 1.08, warmth: 0.45, fade: 0.15, grain: 0.16, mono: false, ...base },
  slide: { saturation: 1.55, contrast: 1.08, brightness: 1, warmth: 0.15, fade: 0, grain: 0.16, mono: false, ...base },
  tinted: { saturation: 1.1, contrast: 0.9, brightness: 1.06, warmth: 0.55, fade: 0.05, grain: 0.16, mono: false, ...base },
  mono: { saturation: 0, contrast: 1.25, brightness: 1.02, warmth: 0, fade: 0, grain: 0.25, mono: true, ...base },
} satisfies Record<string, GradeSettings>;

function template(
  id: string,
  photoRect: TemplateSettings["photoRect"],
  titleRect: TemplateSettings["titleRect"],
  titleColor: string,
  lockedFormat: TemplateSettings["lockedFormat"],
): TemplateSettings {
  return { asset: `/templates/${id}.svg`, photoRect, titleRect, titleColor, lockedFormat };
}

const styles: Style[] = [
  { id: "anlik", categoryId: "film", name: "Anlık Film", thumbnail: art("frame", C, T), kind: "filter", grade: GRADES.faded, frame: "instant",
    promptSeed: "1970'lerden beyaz çerçeveli anlık baskı fotoğraf, soluk camgöbeği gölgeler, kremsi renkler, flaşla çekilmiş samimi kare" },
  { id: "slayt", categoryId: "film", name: "Sıcak Slayt Filmi", thumbnail: art("bands", O, G, T, B), kind: "filter", grade: GRADES.slide,
    promptSeed: "1970'lerde 35 mm renkli slayt filmiyle çekilmiş fotoğraf, doygun kırmızılar, sıcak güneş ışığı, belirgin ama ince gren" },
  { id: "super8", categoryId: "film", name: "Super 8 Karesi", thumbnail: art("check", B, R), kind: "filter", grade: { ...GRADES.warm, leak: 0.6 }, frame: "super8",
    promptSeed: "1970'ler Super 8 ev filminden alınmış kare, yoğun gren, kenarlarda ışık sızıntısı, hafif titrek ve yumuşak odak" },
  { id: "album", categoryId: "film", name: "Aile Albümü", thumbnail: art("frame", G, C), kind: "filter", grade: GRADES.faded, frame: "album",
    promptSeed: "1970'lerden aile albümü fotoğrafı, turuncuya kaçmış renkler, sararmış kâğıt dokusu, solmuş siyahlar" },
  { id: "mahalle", categoryId: "film", name: "Mahalle Fotoğrafçısı", thumbnail: art("frame", C, R), kind: "filter", grade: GRADES.tinted,
    promptSeed: "1970'ler mahalle fotoğrafçısı stüdyosu, elle renklendirilmiş portre, boyalı perde fonu, ciddi poz" },
  { id: "plak", categoryId: "kapak", name: "Plak Kapağı", thumbnail: art("rings", C, G, O, B), kind: "template", grade: GRADES.slide,
    template: template("plak", [0.08, 0.08, 0.84, 0.7], [0.08, 0.82, 0.84, 0.12], "#1F1A17", "kare"),
    promptSeed: "1970'ler plak kapağı, kare kompozisyon, grafik şeritli fon, stüdyoda çekilmiş poz, dönem tipografisine uygun boşluk" },
  { id: "yesilcam", categoryId: "kapak", name: "Yeşilçam Afişi", thumbnail: art("bands", R, O, G, C), kind: "template", grade: GRADES.tinted,
    template: template("yesilcam", [0.08, 0.06, 0.84, 0.66], [0.08, 0.76, 0.84, 0.16], "#FFFBF2", "post"),
    promptSeed: "1970'ler Yeşilçam film afişi, elle boyanmış portre, dramatik bakış, canlı guaj renkler, baskı dokusu" },
  { id: "kaset", categoryId: "kapak", name: "Arabesk Kaset", thumbnail: art("frame", M, G), kind: "template", grade: GRADES.tinted,
    template: template("kaset", [0.1, 0.1, 0.8, 0.62], [0.1, 0.76, 0.8, 0.14], "#FFFBF2", "post"),
    promptSeed: "1970'ler arabesk kaset kapağı, duygulu portre, boyanmış gökyüzü fonu, canlı renk baskı" },
  { id: "punk", categoryId: "kapak", name: "Punk Fanzini", thumbnail: art("check", K, C), kind: "template", grade: GRADES.mono,
    template: template("punk", [0.06, 0.06, 0.88, 0.7], [0.06, 0.8, 0.88, 0.14], "#1F1A17", "post"),
    promptSeed: "1977 punk fanzini fotoğrafı, yüksek kontrastlı siyah beyaz fotokopi dokusu, deri ceket, çengelli iğneler" },
];

const SUFFIX = ["'e", "'e", "'ye", "'e", "'e", "'e", "'ya", "'ye", "'e", "'a"];

export const retro70: LiveConcept = {
  id: "retro-70",
  status: "live",
  name: "70'ler",
  sub: "Anlık film, bohem, Yeşilçam",
  cardArt: art("rings", C, G, O, B),
  title: "70'ler Retro",
  pitch: "Anlık film, plak kapağı, Yeşilçam afişi ve 6 stil daha.",
  theme: { accent: "#BF4316", stage: "#2B1A10" },
  copy: {
    uploadTitle: "Hangi fotoğraf 70'lere gitsin?",
    editTitle: "70'lerin hangi köşesi?",
    cta: "70'lere gönder",
    processingTitle: "Karanlık odada banyo ediliyor",
    processingStages: ["Renkler döneme çekiliyor", "Film dokusu ekleniyor", "Çerçeve hazırlanıyor", "Son rötuşlar yapılıyor"],
    resultTitle: (year) => (year === null ? "70'lere hoş geldin" : `${year}${SUFFIX[year % 10]} hoş geldin`),
  },
  yearRange: { min: 1970, max: 1979, default: 1977 },
  categories: [
    { id: "film", label: "Film ve albüm" },
    { id: "kapak", label: "Afiş ve kapak" },
  ],
  styles,
};
