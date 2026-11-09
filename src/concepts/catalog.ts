import { art, type ArtKind } from "./art";
import { retro70 } from "./retro70";
import type { Concept, LiveConcept, Shelf, SoonConcept } from "./types";

const O = "#D9541E", G = "#E8A317", A = "#6B7A2A", B = "#3B2314", C = "#F4E7CF", T = "#2F7C7A", R = "#8C3A16", K = "#1F1A17", N = "#15233F", V = "#5B2A86", H = "#E6007E", Y = "#FFD400", S = "#00C2D1", W = "#FFFBF2";

function soon(id: string, name: string, sub: string, kind: ArtKind, ...colors: [string, string, string?, string?]): SoonConcept {
  return { id, name, sub, status: "soon", cardArt: art(kind, ...colors) };
}

export const catalog: Shelf[] = [
  {
    id: "retro",
    title: "Retro",
    description: "Her on yılın kendi dünyası var.",
    concepts: [
      soon("retro-50", "50'ler", "Rock'n'roll, pastel, otomobil", "rings", "#F7E7B4", "#BFE3D0", "#F2B5C4", "#C2374A"),
      soon("retro-60", "60'lar", "Mod, pop, uzay yarışı", "waves", K, "#F5F0E6"),
      retro70,
      soon("retro-80", "80'ler", "Neon, atari, omuz vatkası", "lines", H, "#1A0B3B"),
      soon("retro-90", "90'lar", "Grunge, VHS, flanel", "check", T, V),
      soon("retro-y2k", "Y2K", "Krom, pembe, kapaklı telefon", "rings", "#F5F5F7", "#8FD3FF", "#C9CED6", "#FFC3E1"),
    ],
  },
  {
    id: "konseptler",
    title: "Konseptler",
    description: "Müzikten çizgi romana, her biri ayrı bir dünya.",
    concepts: [
      soon("disko", "Disko ve Müzik", "Dans pisti, konser, plak", "check", V, Y),
      soon("cizgi", "Çizgi Kahraman", "Kostüm, süper güç, çizgi roman", "dots", "#C4161C", Y),
      soon("afis", "Sinema Afişi", "Kendi filminin başrolü", "bands", N, O, G, K),
      soon("kara", "Kara Film", "Gölge, duman, gizem", "bands", K, "#3A3A3A", "#8A8A8A", W),
      soon("bati", "Vahşi Batı", "Kasaba, toz, kovboy şapkası", "sun", O, R),
      soon("yesilcam", "Yeşilçam", "Elle boyanmış afişler", "bands", R, O, G, C),
      soon("uzay", "Uzay Macerası", "Gezegenler, kapsüller, yıldızlar", "rings", W, S, V, N),
      soon("fantastik", "Fantastik Diyar", "Şatolar, ejderhalar, büyü", "waves", A, "#8A9A3A"),
      soon("cyberpunk", "Cyberpunk Şehir", "Neon yağmur, gelecek", "lines", S, "#120A2A"),
      soon("yagliboya", "Yağlı Boya", "Klasik müze portresi", "frame", G, B),
      soon("suluboya", "Suluboya", "Yumuşak, akışkan renkler", "waves", "#BFD9E6", "#E7EFF2"),
      soon("moda", "Moda Kapağı", "Dergi kapağında sen", "frame", H, W),
    ],
  },
];

function isLive(c: Concept): c is LiveConcept {
  return c.status === "live";
}

export function getLiveConcept(id: string): LiveConcept | undefined {
  return catalog.flatMap((s) => s.concepts).filter(isLive).find((c) => c.id === id);
}
