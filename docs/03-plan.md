# Kılık Aşama 1 Geliştirme Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 70'ler konseptinin tarayıcıda çalıştığı, sıfır maliyetli, telefon öncelikli doğrulama sürümünü yayınlamak.

**Architecture:** React tek sayfa uygulaması; konseptler veri dosyalarından gelir. Görsel işleme `ImageEngine` arayüzünün arkasında, MediaPipe ve WebGL2 ile cihazda çalışır. Hesap ve talep verisi Firebase'te, kullanım olayları PostHog EU'da tutulur.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Vitest, Testing Library, Playwright, `@mediapipe/tasks-vision`, Firebase JS SDK, Firebase Emulator, PostHog JS, Cloudflare Pages.

**Spec:** [BRD](01-brd.md) ve [Analiz](02-analiz.md). Tasarım: [onaylı tuval](https://claude.ai/artifact/75QdXcDqHHqWK13nLfbr3d).

## Global Constraints

- Fotoğraf, sonuç, dosya adı ve yüz bilgisi hiçbir ağ isteğine girmez.
- Aylık maliyet 0 $; ücretli plan gerektiren hizmet kullanılmaz (Firebase Cloud Storage ve Cloud Functions dahil).
- Kabul edilen dosyalar: `image/jpeg`, `image/png`, `image/webp`; üst sınır 20 MB (20 × 1024 × 1024 bayt).
- Dışa aktarma uzun kenarı `MAX_EXPORT_EDGE = 2048`; önizleme `MAX_PREVIEW_EDGE = 720`. Görev 1 sonucu farklıysa yalnızca bu sabitler değişir.
- Formatlar: `post` 4:5, `kare` 1:1, `story` 9:16.
- Dokunma hedefleri en az 44 px; metin kontrastı en az 4.5:1.
- Arayüz Türkçe, `<html lang="tr">`; küçük harf dönüşümlerinde `toLocaleLowerCase("tr")`.
- Tarayıcılar: iOS Safari 16+, Android Chrome ve masaüstü Chrome/Safari/Edge son iki sürüm.
- Renkler: mürekkep `#1F1A17`, kâğıt `#F7F1E4`, yüzey `#FFFBF2`, marka `#BF4316`, ikincil metin `#5F5247`, hata `#A32A12`.
- Yazı tipleri projeyle paketlenir: Caprasimo ve Outfit (`@fontsource`, `latin-ext` dahil).
- Dış servislere yalnızca `src/services/` üzerinden erişilir.
- Commit mesajları şu satırla biter: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Tüm işler `feat/asama-1` dalında yapılır; `main` dalına doğrudan commit atılmaz.

## Review Focus

1. Sonuç ekranındayken sayfa yenilenir veya geri tuşuna basılırsa uygulama çökmez, fotoğraf seçimine döner (Görev 8).
2. iPhone'da döndürülmüş EXIF'li fotoğraf, önizlemede ve dosyada dik görünür (Görev 6).
3. Telefon arka plana alınıp WebGL bağlamı kaybolursa dönüşte boş görüntü yerine yeniden işlenmiş sonuç görünür (Görev 7).
4. Aşırı geniş (8000×1000) fotoğraf her formatta bozulmadan kırpılır (Görev 7).
5. Kullanıcı giriş penceresini kapatırsa sonuç ekranda kalır, indirme başlamaz, hata gösterilmez (Görev 11).

---

### Task 1: Doğrulama testi ve karar

Atılabilir kod; TDD uygulanmaz. Analiz bölüm 12'deki soruları cevaplar. **Kullanıcı kararı (2026-11-08):** Sahne stilleri kesim doğrulanana kadar ertelendi; bu görev sonraki görevleri bekletmez. Gerçek cihaz testi Görev 15'te yapılır.

**Files:**
- Create: `spikes/segmentation/` (index.html, main.ts, package.json), `docs/dogrulama-sonucu.md`

**Interfaces:**
- Produces: `MAX_EXPORT_EDGE` kararı, kullanılacak model (256 veya 512), sahne stilleri için devam/iptal kararı

- [ ] **Adım 1: Dal aç ve dokümanları kaydet**

```bash
git switch -c feat/asama-1
git add docs && git commit -m "docs: add BRD, analysis and plan"
```

- [ ] **Adım 2: Test sayfasını kur**

Vite ile tek sayfa. İçerik: dosya seçme, `selfie_multiclass_256x256.tflite` ile kesim, kişiyi düz renkli sahneye yerleştirme, WebGL2 çıktısını `toBlob` ile JPEG yapma, `navigator.share({files})` ve indirme düğmeleri, ekranda süre ve hata günlüğü. Sayfa `npx wrangler pages deploy` ile geçici `pages.dev` adresine yüklenir (telefonlar için HTTPS gerekir).

- [ ] **Adım 3: Gerçek cihazlarda ölç**

iPhone Safari, Android Chrome, Instagram ve TikTok tarayıcılarında 20 izinli fotoğrafla dene.

Geçme ölçütleri: en az 16/20 kabul edilebilir kesim; model indikten sonra sonuç 5 saniyenin altında; çökme yok; JPEG doğru boyutta; paylaşım menüsü dosya gönderiyor.

- [ ] **Adım 4: Sonucu yaz ve kullanıcıya sun**

`docs/dogrulama-sonucu.md`: cihaz bazında tablo, seçilen model, `MAX_EXPORT_EDGE`, uygulama içi tarayıcı davranışı.

Ölçütler sağlanmazsa **dur**: sahne stillerini çıkarma kararını kullanıcıya sor.

- [ ] **Adım 5: Commit**

```bash
git add docs/dogrulama-sonucu.md spikes && git commit -m "docs: record segmentation spike results"
```

---

### Task 2: Tasarım tuvalini kararlara göre güncelle

Kod değil; tuval güncellemesi. BRD bölüm 9'daki farklar, 12 stil listesi ve kapak başlığı alanı uygulanır.

- [ ] **Adım 1:** Tuvali güncelle: giriş sonuç ekranında açılan adım olur, Apple düğmesi kalkar, prompt alanı ve "Şunu değiştir" gizlenir, "haber ver" ve "Fotoğrafların cihazından çıkmaz." eklenir.
- [ ] **Adım 2:** Kullanıcıdan görsel onay al. Beklenen: ekranlar BRD 9 ile uyumlu.

---

### Task 3: Proje iskeleti, tema ve yönlendirme

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/routes.ts`, `src/ui/theme.css`, `src/ui/AppHeader.tsx`, `src/app/App.test.tsx`
- Create: `CLAUDE.md` (`init` skill ile)

**Interfaces:**
- Produces: yollar `paths.gallery = "/"`, `paths.photo(id) = "/k/{id}/foto"`, `paths.editor(id) = "/k/{id}/stil"`, `paths.result(id) = "/k/{id}/sonuc"`, `paths.privacy = "/gizlilik"`, `paths.account = "/hesap"`

- [ ] **Adım 1: Failing test yaz**

```tsx
it("galeri yolunda marka başlığını gösterir", () => {
  renderAt("/");
  expect(screen.getByRole("button", { name: "kılık" })).toBeInTheDocument();
});
it("bilinmeyen yolda galeriye döner", () => {
  renderAt("/yok");
  expect(window.location.pathname).toBe("/");
});
```

- [ ] **Adım 2:** `npx vitest run src/app/App.test.tsx` çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Vite + React + TS iskeletini kur, tema değişkenlerini ve `@fontsource` yazı tiplerini ekle, yönlendirmeyi yaz.
- [ ] **Adım 4:** `npx vitest run` ve `npx tsc --noEmit` çalıştır. Beklenen: PASS, hata yok.
- [ ] **Adım 5:** `init` skill ile `CLAUDE.md` oluştur.
- [ ] **Adım 6:** Commit: `feat: scaffold app shell and routing`.

---

### Task 4: Konsept kataloğu

**Files:**
- Create: `src/concepts/types.ts`, `src/concepts/catalog.ts`, `src/concepts/retro70.ts`, `src/concepts/validate.ts`, `src/concepts/catalog.test.ts`

**Interfaces:**
- Produces (`types.ts`):

```ts
export type VariantId = "ozgun" | "solgun" | "canli";
export type FormatId = "post" | "kare" | "story";
export type FilmOptionId = "grain" | "leak" | "fade" | "orangeShift" | "vignette" | "dateStamp";
export interface GradeSettings { saturation: number; contrast: number; brightness: number; warmth: number; fade: number; grain: number; vignette: number; leak: number; mono: boolean; }
export interface TemplateSettings { asset: string; photoRect: [number, number, number, number]; titleRect: [number, number, number, number]; titleColor: string; lockedFormat?: FormatId; }
export interface Style { id: string; categoryId: string; name: string; thumbnail: string; kind: "filter" | "scene" | "template"; grade: GradeSettings; sceneAsset?: string; template?: TemplateSettings; frame?: "none" | "instant" | "super8" | "album"; promptSeed?: string; }
export interface ConceptBase { id: string; name: string; sub: string; cardArt: string; }
export interface SoonConcept extends ConceptBase { status: "soon"; }
export interface LiveConcept extends ConceptBase { status: "live"; theme: { accent: string; stage: string }; copy: ConceptCopy; yearRange?: { min: number; max: number; default: number }; categories: { id: string; label: string }[]; styles: Style[]; }
export type Concept = LiveConcept | SoonConcept;
export interface Shelf { id: string; title: string; description: string; concepts: Concept[]; }
export interface Selection { conceptId: string; styleId: string; variant: VariantId; options: ReadonlySet<FilmOptionId>; year: number | null; format: FormatId; title: string; }
```

- Produces: `catalog: Shelf[]`, `getLiveConcept(id: string): LiveConcept | undefined`, `validateCatalog(shelves: Shelf[]): string[]`

- [ ] **Adım 1: Failing test yaz**

```ts
it("katalog geçerli", () => expect(validateCatalog(catalog)).toEqual([]));
it("Retro rafı on yıl sırasıyla", () =>
  expect(catalog[0].concepts.map(c => c.name)).toEqual(["50'ler","60'lar","70'ler","80'ler","90'lar","Y2K"]));
it("12 ek konsept var", () => expect(catalog[1].concepts).toHaveLength(12));
it("yalnızca retro-70 canlı", () =>
  expect(catalog.flatMap(s => s.concepts).filter(c => c.status === "live").map(c => c.id)).toEqual(["retro-70"]));
it("70'ler ilk sürümde 5 filtre ve 4 şablon içerir, sahne içermez", () => {
  const k = getLiveConcept("retro-70")!.styles.map(s => s.kind);
  expect([k.filter(x => x==="filter").length, k.filter(x => x==="scene").length, k.filter(x => x==="template").length]).toEqual([5,0,4]);
});
it("eksik sahne dosyası hatası verir", () => {
  expect(validateCatalog(catalogWithSceneMissingAsset())).toContain("retro-70/salon: sceneAsset eksik");
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Tipleri, doğrulayıcıyı ve veriyi yaz. Kart adları, açıklamalar ve metinler onaylı tuvalden; 12 stil Analiz bölüm 6'dan. `yearRange = {min:1970,max:1979,default:1977}`. `validateCatalog`: benzersiz id, `scene` için `sceneAsset`, `template` için `template`, her stilin kategorisi mevcut.
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add concept catalog with retro 70s data`.

---

### Task 5: Konsept galerisi

**Files:**
- Create: `src/features/gallery/GalleryPage.tsx`, `src/features/gallery/ConceptCard.tsx`, `src/features/gallery/GalleryPage.test.tsx`

**Interfaces:**
- Consumes: `catalog`, `paths.photo`

- [ ] **Adım 1: Failing test yaz**

```tsx
it("canlı kart fotoğraf ekranına götürür", async () => {
  renderAt("/");
  await user.click(screen.getByRole("button", { name: /70'ler/ }));
  expect(window.location.pathname).toBe("/k/retro-70/foto");
});
it("Yakında kartları tıklanamaz", () => {
  renderAt("/");
  expect(screen.queryByRole("button", { name: /Çizgi Kahraman/ })).toBeNull();
  expect(screen.getAllByText("Yakında")).toHaveLength(17);
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Sayfayı tuvaldeki "Konsept galerisi" düzeniyle yaz: üstte canlı konsept afişi, altında raflar. Girişsiz görülür (H-1).
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add concept gallery`.

---

### Task 6: Fotoğraf seçimi

**Files:**
- Create: `src/engine/types.ts`, `src/engine/limits.ts`, `src/engine/photoFile.ts`, `src/engine/photoFile.test.ts`, `src/app/session.tsx`, `src/features/upload/UploadPage.tsx`, `src/features/upload/UploadPage.test.tsx`, `e2e/fixtures/exif-rotated.jpg`, `e2e/orientation.spec.ts`

**Interfaces:**
- Consumes: `Selection`, `LiveConcept`, `Style`, `VariantId`, `FilmOptionId`, `FormatId`
- Produces (`src/engine/types.ts`):

```ts
export type EngineCapability = "grade" | "segment" | "prompt" | "identity";
export interface PreparedPhoto { bitmap: ImageBitmap; width: number; height: number; }
export interface RenderRequest { style: Style; variant: VariantId; options: ReadonlySet<FilmOptionId>; year: number | null; yearRange?: { min: number; max: number }; format: FormatId; title: string; quality: "preview" | "export"; }
export interface RenderResult { blob: Blob; width: number; height: number; }
export interface ImageEngine { id: string; capabilities: ReadonlySet<EngineCapability>; prepare(photo: Blob): Promise<PreparedPhoto>; render(prepared: PreparedPhoto, request: RenderRequest): Promise<RenderResult>; dispose(prepared: PreparedPhoto): void; }
```

- Produces (`src/engine/limits.ts`): `MAX_EXPORT_EDGE = 2048`, `MAX_PREVIEW_EDGE = 720`, `MAX_FILE_BYTES = 20 * 1024 * 1024`
- Produces: `useSession(): { photo: PreparedPhoto | null; setPhoto(p: PreparedPhoto | null): void; selection: Selection; updateSelection(patch: Partial<Selection>): void; resetSelection(concept: LiveConcept): void }`
- Produces: `validatePhotoFile(file: File): PhotoError | null`, `decodePhoto(photo: Blob, maxEdge: number): Promise<ImageBitmap>`
- Produces: `type PhotoError = "unsupported" | "tooLarge" | "corrupt"`, `photoErrorMessage: Record<PhotoError, string>`

- [ ] **Adım 1: Failing test yaz**

```ts
it("HEIC reddedilir", () => expect(validatePhotoFile(file("a.heic","image/heic",100))).toBe("unsupported"));
it("20 MB kabul edilir", () => expect(validatePhotoFile(file("a.jpg","image/jpeg",20*1024*1024))).toBeNull());
it("20 MB + 1 bayt reddedilir", () => expect(validatePhotoFile(file("a.jpg","image/jpeg",20*1024*1024+1))).toBe("tooLarge"));
it("boş dosya bozuk sayılır", () => expect(validatePhotoFile(file("a.jpg","image/jpeg",0))).toBe("corrupt"));
```

```tsx
it("cihazdan çıkmaz bilgisini gösterir", () => {
  renderAt("/k/retro-70/foto");
  expect(screen.getByText("Fotoğrafların cihazından çıkmaz.")).toBeInTheDocument();
});
it("izin uyarısını gösterir", () => {
  renderAt("/k/retro-70/foto");
  expect(screen.getByText(/izin aldığın kişilerinkini/)).toBeInTheDocument();
});
```

```ts
// e2e/orientation.spec.ts
test("EXIF ile döndürülmüş fotoğraf dik çözülür", async ({ page }) => {
  const size = await decodeFixtureInPage(page, "exif-rotated.jpg");
  expect(size.height).toBeGreaterThan(size.width);
});
```

- [ ] **Adım 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** `useSession` context'ini yaz. `decodePhoto` için `createImageBitmap(photo, { imageOrientation: "from-image" })`; uzun kenar `maxEdge` üstündeyse ölçekle; çözülemezse `"corrupt"` fırlat. Hata metinleri: `unsupported` "Bu dosya desteklenmiyor. JPG, PNG ya da WEBP seç.", `tooLarge` "Bu fotoğraf 20 MB'tan büyük. Daha küçük bir dosya seç.", `corrupt` "Fotoğraf okunamadı. Başka bir dosya dene.". Sayfa: seçme ve sürükle-bırak, başlık `concept.copy.uploadTitle`, başarıda `paths.editor`.
- [ ] **Adım 4:** `npx vitest run src/engine src/features/upload` ve `npx playwright test e2e/orientation.spec.ts` çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add photo selection and validation`.

---

### Task 7: Görsel motor (filtreler)

**Files:**
- Create: `src/engine/grade.ts`, `src/engine/grade.test.ts`, `src/engine/geometry.ts`, `src/engine/geometry.test.ts`, `src/engine/gl/renderer.ts`, `src/engine/gl/shaders.ts`, `src/engine/filterEngine.ts`, `src/dev/engine-harness.html`, `e2e/engine.spec.ts`

**Interfaces:**
- Consumes: `ImageEngine`, `PreparedPhoto`, `RenderRequest`, `RenderResult`, `decodePhoto`, `MAX_EXPORT_EDGE`, `MAX_PREVIEW_EDGE`, `Style`, `GradeSettings`, `VariantId`, `FilmOptionId`, `FormatId`
- Produces: `resolveGrade(base, variant, options, year, yearRange): GradeSettings`, `outputSize(format, maxEdge): {width,height}`, `coverCrop(srcW, srcH, dstW, dstH): {x,y,w,h}`, `dateStamp(year): string`, `createFilterEngine(): ImageEngine`

- [ ] **Adım 1: Failing test yaz**

```ts
const base: GradeSettings = { saturation:1, contrast:1, brightness:1, warmth:0, fade:0, grain:.16, vignette:0, leak:0, mono:false };
it("Solgun doygunluğu ve kontrastı düşürür", () => {
  const g = resolveGrade(base,"solgun",new Set(),null);
  expect(g.saturation).toBeCloseTo(.8); expect(g.contrast).toBeCloseTo(.88); expect(g.fade).toBeCloseTo(.15);
});
it("Canlı doygunluğu artırır", () => expect(resolveGrade(base,"canli",new Set(),null).saturation).toBeCloseTo(1.25));
it("gren seçeneği en az .32 yapar", () => expect(resolveGrade(base,"ozgun",new Set(["grain"]),null).grain).toBeCloseTo(.32));
it("1970 daha sıcak, 1979 daha serin", () => {
  const r = {min:1970,max:1979};
  expect(resolveGrade(base,"ozgun",new Set(),1970,r).warmth).toBeCloseTo(.06);
  expect(resolveGrade(base,"ozgun",new Set(),1979,r).warmth).toBeCloseTo(-.06);
});
it("format boyutları", () => {
  expect(outputSize("post",2048)).toEqual({width:1638,height:2048});
  expect(outputSize("kare",2048)).toEqual({width:2048,height:2048});
  expect(outputSize("story",2048)).toEqual({width:1152,height:2048});
});
it("aşırı geniş fotoğraf ortadan kırpılır", () => {
  const c = coverCrop(8000,1000,1638,2048);
  expect(c.h).toBe(1000); expect(c.w).toBeCloseTo(799.8,0); expect(c.x).toBeCloseTo(3600.1,0);
});
it("tarih damgası", () => expect(dateStamp(1977)).toBe("'77 08 14"));
```

```ts
// e2e/engine.spec.ts
test("export istenen boyutta JPEG üretir", async ({ page }) => { /* harness: story, export */
  const r = await renderInHarness(page, { format:"story", quality:"export" });
  expect([r.width,r.height,r.type]).toEqual([1152,2048,"image/jpeg"]);
});
test("varyasyonlar farklı pikseller üretir", async ({ page }) => {
  expect(await renderHash(page,"ozgun")).not.toEqual(await renderHash(page,"solgun"));
});
test("WebGL bağlamı kaybolunca yeniden işler", async ({ page }) => {
  await loseContext(page);
  expect(await renderNonBlank(page)).toBe(true);
});
```

- [ ] **Adım 2:** Testleri çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** `grade.ts` ve `geometry.ts` saf fonksiyonlarını yaz. Yıl: `t=(year-min)/(max-min)`, `warmth += .06-.12*t`, `fade += .05*(1-t)`. Seçenekler: `grain`→`max(g,.32)`, `leak`→`max(l,.6)`, `fade`→`+.15`, `orangeShift`→`warmth+.1`, `vignette`→`max(v,.4)`. `dateStamp` motorda çerçeveli stillerde veya seçenek açıkken çizilir.
- [ ] **Adım 4:** WebGL2 hattını yaz: tek shader (renk, sıcaklık, solma, gren, vinyet, sızıntı). Sonuç `canvas.toBlob("image/jpeg", .9)`. `webglcontextlost` sonrası bağlam ve dokular bir sonraki `render` çağrısında yeniden kurulur; WebGL2 yoksa `Error("webgl_unavailable")`. `createFilterEngine` yeteneği: yalnızca `grade`.
- [ ] **Adım 5:** `npx vitest run src/engine` ve `npx playwright test e2e/engine.spec.ts` çalıştır. Beklenen: PASS.
- [ ] **Adım 6:** Commit: `feat: add WebGL filter engine`.

---

### Task 8: Stil ekranı

**Files:**
- Create: `src/features/editor/EditorPage.tsx`, `src/features/editor/StyleGrid.tsx`, `src/features/editor/FilmOptions.tsx`, `src/features/editor/FormatPicker.tsx`, `src/features/editor/EditorPage.test.tsx`

**Interfaces:**
- Consumes: `useSession`, `ImageEngine`, `getLiveConcept`
- Produces: `useEngine(): ImageEngine` (`src/engine/EngineContext.tsx`, testte sahte motor verilir)

- [ ] **Adım 1: Failing test yaz**

```tsx
it("fotoğraf yoksa fotoğraf seçimine döner", () => {
  renderAt("/k/retro-70/stil", { photo: null });
  expect(window.location.pathname).toBe("/k/retro-70/foto");
});
it("canlı olmayan konsept galeriye döner", () => {
  renderAt("/k/cizgi/stil", { photo: fakePhoto });
  expect(window.location.pathname).toBe("/");
});
it("motorda prompt yoksa prompt alanı görünmez", () => {
  renderAt("/k/retro-70/stil", { photo: fakePhoto, engine: fakeEngine(["grade"]) });
  expect(screen.queryByLabelText("Prompt")).toBeNull();
});
it("motorda prompt varsa prompt alanı görünür", () => {
  renderAt("/k/retro-70/stil", { photo: fakePhoto, engine: fakeEngine(["grade","prompt"]) });
  expect(screen.getByLabelText("Prompt")).toBeInTheDocument();
});
it("kilitli formatlı şablonda format değişmez", async () => {
  renderAt("/k/retro-70/stil", { photo: fakePhoto });
  await user.click(screen.getByRole("button", { name: "Afiş ve kapak" }));
  await user.click(screen.getByRole("button", { name: "Plak Kapağı" }));
  expect(screen.getByRole("button", { name: "Kare 1:1" })).toHaveAttribute("aria-pressed","true");
  expect(screen.getByRole("button", { name: "Hikâye 9:16" })).toBeDisabled();
});
it("başlık 30 karakterle sınırlı", () => {
  renderAtTemplate();
  expect(screen.getByLabelText("Kapak başlığı")).toHaveAttribute("maxlength","30");
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Ekranı tuvaldeki düzenle yaz. Önizleme `quality:"preview"`; hızlı seçim değişikliklerinde yalnızca son istek ekrana yansır. Yıl kaydırıcısı `yearRange` varsa görünür. Düğme metni `concept.copy.cta`.
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add style editor`.

---

### Task 9: İşleme, sonuç, indirme ve paylaşma

**Files:**
- Create: `src/features/result/ResultPage.tsx`, `src/features/result/CompareSlider.tsx`, `src/features/result/ProcessingPanel.tsx`, `src/services/share.ts`, `src/services/share.test.ts`, `src/features/result/ResultPage.test.tsx`

**Interfaces:**
- Consumes: `RenderResult`, `useEngine`, `useSession`
- Produces: `shareOrDownload(blob: Blob, filename: string, mode: "share" | "download", env?: ShareEnv): Promise<"shared" | "downloaded" | "cancelled">`, `resultFilename(styleId: string, format: FormatId): string`

- [ ] **Adım 1: Failing test yaz**

```ts
it("paylaşım desteklenmiyorsa indirir", async () => {
  expect(await shareOrDownload(blob,"a.jpg","share",{ canShare: () => false, download })).toBe("downloaded");
});
it("kullanıcı paylaşımı iptal ederse indirmez", async () => {
  const share = () => Promise.reject(new DOMException("x","AbortError"));
  expect(await shareOrDownload(blob,"a.jpg","share",{ canShare: () => true, share, download })).toBe("cancelled");
  expect(download).not.toHaveBeenCalled();
});
it("dosya adı", () => expect(resultFilename("anlik","post")).toBe("kilik-anlik-post.jpg"));
```

```tsx
it("varyasyon seçilince yeniden işler", async () => {
  renderResult(); await user.click(screen.getByRole("button",{name:"Solgun"}));
  expect(fakeEngine.render).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variant:"solgun" }));
});
it("sonuç başlığı yıl ekiyle yazılır", () => {
  renderResult({ year:1977 });
  expect(screen.getByRole("heading",{name:"1977'ye hoş geldin"})).toBeInTheDocument();
});
it("yeniden yüklemede fotoğraf yoksa seçime döner", () => {
  renderAt("/k/retro-70/sonuc",{photo:null});
  expect(window.location.pathname).toBe("/k/retro-70/foto");
});
it("WebGL yoksa açıklama gösterir", async () => {
  renderResult({ engine: rejectingEngine("webgl_unavailable") });
  expect(await screen.findByRole("alert")).toHaveTextContent("Bu cihaz görsel işlemeyi desteklemiyor.");
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Ekranı yaz: işlem sürerken `ProcessingPanel` (`concept.copy.processingTitle` ve `processingStages`), sonra önce/sonra kaydırıcısı (klavye ile kullanılabilen `input[type=range]`), Özgün/Solgun/Canlı, İndir, Paylaş, "Prompt" yerine "Stile dön", "Yeni fotoğraf", "Başka konsept". Yıl eki Türkçe tablo: `["'e","'e","'ye","'e","'e","'e","'ya","'ye","'e","'a"][yıl % 10]`. Bu görevde indirme doğrudan çalışır; giriş adımı Görev 11'de eklenir.
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add result screen with download and share`.

---

### Task 10: Şablon stilleri

Sahne stilleri ve MediaPipe bu sürümde yoktur. `Style.kind` tipindeki `"scene"` değeri sonraki sürüm için kalır.

**Files:**
- Create: `src/engine/compose.ts`, `src/engine/compose.test.ts`, `public/templates/{plak,yesilcam,kaset,punk}.svg`
- Modify: `src/engine/filterEngine.ts`, `e2e/engine.spec.ts`

**Interfaces:**
- Consumes: `RenderRequest`, `TemplateSettings`
- Produces: `clampTitle(text: string): string`

- [ ] **Adım 1: Failing test yaz**

```ts
it("başlık 30 karaktere kırpılır ve boşlukları temizlenir", () => expect(clampTitle("  " + "ş".repeat(40))).toHaveLength(30));
```

```ts
// e2e/engine.spec.ts
test("şablon kilitli formatta üretilir", async ({ page }) => {
  const r = await renderInHarness(page, { style:"plak", format:"kare", quality:"export", title:"Şarkılar" });
  expect([r.width,r.height]).toEqual([2048,2048]);
});
test("başlık çıktıyı değiştirir", async ({ page }) => {
  expect(await renderHash(page,"ozgun",{ style:"plak", title:"A" })).not.toEqual(await renderHash(page,"ozgun",{ style:"plak", title:"B" }));
});
test("üretim ağ isteği yapmaz", async ({ page }) => {
  const requests = trackRequests(page, "**/*");
  const before = requests.count();
  await renderInHarness(page, { style:"anlik", fixture:"portrait.jpg" });
  expect(requests.count()).toBe(before);
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** `compose.ts`: Canvas 2D ile katman sırası şablon, fotoğraf (WebGL çıktısı, `photoRect` içine `coverCrop`), çerçeve, başlık (`titleRect`), tarih damgası. Yazı tipi çizimden önce `document.fonts.load` ile beklenir. Tüm şablon görselleri aynı alan adından gelir.
- [ ] **Adım 4:** Afiş ve kapak dilinde SVG'leri çiz.
- [ ] **Adım 5:** Testleri çalıştır. Beklenen: PASS.
- [ ] **Adım 6:** Commit: `feat: add template styles`.

---

### Task 11: Giriş ve uygulama içi tarayıcı

**Files:**
- Create: `src/services/firebase.ts`, `src/services/auth.ts`, `src/services/auth.test.ts`, `src/services/inAppBrowser.ts`, `src/services/inAppBrowser.test.ts`, `src/features/auth/AuthDialog.tsx`, `src/features/auth/useAuthGate.tsx`, `src/features/auth/AuthDialog.test.tsx`, `.env.example`
- Modify: `src/features/result/ResultPage.tsx`

**Interfaces:**
- Produces: `AuthUser { uid: string; email: string | null; emailVerified: boolean; displayName: string | null }`
- Produces: `signInWithGoogle(): Promise<AuthUser>`, `registerWithEmail(name, email, password): Promise<AuthUser>`, `signInWithEmail(email, password): Promise<AuthUser>`, `signOutUser(): Promise<void>`, `deleteCurrentAccount(): Promise<void>`, `onAuthChange(cb: (u: AuthUser | null) => void): () => void`, `mapAuthError(code: string): string`
- Produces: `useAuthGate(): { user: AuthUser | null; requireAuth(trigger: "download" | "share" | "demand"): Promise<AuthUser | null> }`
- Produces: `detectInAppBrowser(ua: string): "instagram" | "facebook" | "tiktok" | null`

- [ ] **Adım 1: Failing test yaz**

```ts
it("Instagram tarayıcısını tanır", () => expect(detectInAppBrowser("Mozilla/5.0 (iPhone) Instagram 300.0")).toBe("instagram"));
it("TikTok tarayıcısını tanır", () => expect(detectInAppBrowser("Mozilla/5.0 musical_ly_30 BytedanceWebview")).toBe("tiktok"));
it("normal Safari'yi uygulama içi saymaz", () => expect(detectInAppBrowser("Mozilla/5.0 (iPhone) Version/18.0 Safari/604.1")).toBeNull());
it("hatalı şifre mesajı", () => expect(mapAuthError("auth/invalid-credential")).toBe("E-posta veya şifre hatalı."));
it("engellenen pencere mesajı", () => expect(mapAuthError("auth/popup-blocked")).toBe("Giriş penceresi engellendi. Tekrar dene ya da e-postayla devam et."));
```

```tsx
it("giriş yoksa indirme önce giriş ister", async () => {
  renderResult({ user:null }); await user.click(screen.getByRole("button",{name:"İndir"}));
  expect(screen.getByRole("dialog",{name:/Giriş/})).toBeInTheDocument();
  expect(download).not.toHaveBeenCalled();
});
it("girişten sonra indirme devam eder", async () => {
  renderResult({ user:null }); await user.click(screen.getByRole("button",{name:"İndir"}));
  await completeEmailLogin();
  expect(download).toHaveBeenCalledOnce();
});
it("pencere kapatılırsa sonuç kalır ve indirme olmaz", async () => {
  renderResult({ user:null, google: rejectWith("auth/popup-closed-by-user") });
  await user.click(screen.getByRole("button",{name:"İndir"}));
  await user.click(screen.getByRole("button",{name:"Google ile devam et"}));
  expect(download).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("heading",{name:/hoş geldin/})).toBeInTheDocument();
});
it("uygulama içi tarayıcıda Google gizlenir, yönlendirme görünür", () => {
  renderAuthDialog({ inApp:"instagram" });
  expect(screen.queryByRole("button",{name:"Google ile devam et"})).toBeNull();
  expect(screen.getByText(/Safari veya Chrome'da aç/)).toBeInTheDocument();
});
it("doğrulanmamış e-posta ilk indirmeyi engellemez", async () => {
  renderResult({ user:{ uid:"u", email:"a@b.co", emailVerified:false, displayName:null } });
  await user.click(screen.getByRole("button",{name:"İndir"}));
  expect(download).toHaveBeenCalledOnce();
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Firebase'i yapılandır (`VITE_FIREBASE_*`). Google yalnızca `signInWithPopup`; yönlendirme kullanılmaz, sayfa değişmediği için sonuç bellekte kalır. Kayıtta `sendEmailVerification` çağrılır ve diyalogda "Doğrulama bağlantısını e-postana gönderdik." gösterilir.
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add auth gate for download and share`.

---

### Task 12: Talep toplama ve güvenlik kuralları

**Files:**
- Create: `firestore.rules`, `firebase.json`, `tests/rules/firestore.test.ts`, `src/services/demand.ts`, `src/features/result/DemandButton.tsx`, `src/features/result/DemandButton.test.tsx`

**Interfaces:**
- Consumes: `useAuthGate`, `AuthUser`
- Produces: `registerDemand(user: AuthUser, conceptId: string): Promise<"saved" | "unverified">`

- [ ] **Adım 1: Failing test yaz** (`@firebase/rules-unit-testing`)

```ts
it("kullanıcı kendi profilini yazar", () => assertSucceeds(setDoc(doc(as("u1"),"users/u1"),{displayName:"A"})));
it("başkasının profilini okuyamaz", () => assertFails(getDoc(doc(as("u1"),"users/u2"))));
it("doğrulanmış kullanıcı talep oluşturur", () => assertSucceeds(createDemand(as("u1",{email_verified:true}),"u1","retro-70")));
it("doğrulanmamış kullanıcı talep oluşturamaz", () => assertFails(createDemand(as("u1",{email_verified:false}),"u1","retro-70")));
it("başkası adına talep oluşturulamaz", () => assertFails(createDemand(as("u1",{email_verified:true}),"u2","retro-70")));
it("girişsiz okuma yok", () => assertFails(getDoc(doc(anon(),"demand/u1_retro-70"))));
```

```tsx
it("doğrulanmamışsa e-posta uyarısı gösterir", async () => {
  renderDemand({ registerDemand: async () => "unverified" });
  await user.click(screen.getByRole("button",{name:/haber ver/}));
  expect(screen.getByText(/e-postanı doğrula/)).toBeInTheDocument();
});
it("kayıttan sonra onay gösterir", async () => {
  renderDemand({ registerDemand: async () => "saved" });
  await user.click(screen.getByRole("button",{name:/haber ver/}));
  expect(screen.getByText("Listedesin")).toBeInTheDocument();
});
```

- [ ] **Adım 2:** `npx firebase emulators:exec --only firestore "npx vitest run tests/rules"` çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Kuralları yaz (Analiz bölüm 8). Belge kimliği `${uid}_${conceptId}`, aynı talep tekrar yazılırsa çoğalmaz. Düğme metni: "Kıyafetini ve mekânı da yapay zekâyla değiştir, açılınca haber ver".
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add demand capture and Firestore rules`.

---

### Task 13: Ölçüm

**Files:**
- Create: `src/services/analytics.ts`, `src/services/analytics.test.ts`
- Modify: galeri, yükleme, sonuç, giriş ve talep bileşenleri

**Interfaces:**
- Produces: `track(event: AnalyticsEvent): void` (Analiz bölüm 9'daki olaylar için ayrık tip), `sizeBucket(bytes): "<2MB" | "2-8MB" | ">8MB"`, `durationBucket(ms): "<1s" | "1-3s" | "3-5s" | ">5s"`

- [ ] **Adım 1: Failing test yaz**

```ts
it("izinli alanları gönderir", () => {
  track({ name:"result_viewed", styleId:"anlik", kind:"filter", duration:"<1s" });
  expect(capture).toHaveBeenCalledWith("result_viewed",{ styleId:"anlik", kind:"filter", duration:"<1s" });
});
it("izin listesi dışındaki alanları atar", () => {
  track({ name:"photo_selected", fileType:"image/jpeg", size:"<2MB", fileName:"yuz.jpg" } as never);
  expect(capture.mock.calls[0][1]).not.toHaveProperty("fileName");
});
it("anahtar yoksa hiçbir şey göndermez", () => { noKey(); track(sample); expect(capture).not.toHaveBeenCalled(); });
it("boyut aralığı", () => expect(sizeBucket(3*1024*1024)).toBe("2-8MB"));
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** PostHog: `api_host:"https://eu.i.posthog.com"`, `persistence:"memory"`, `autocapture:false`, `capture_pageview:false`, `disable_session_recording:true`. Olay başına izinli alan listesi uygula. Olayları bileşenlere bağla. IP kaydının proje ayarında kapalı olduğunu kurulum listesine yaz.
- [ ] **Adım 4:** Testi çalıştır. Beklenen: PASS.
- [ ] **Adım 5:** Commit: `feat: add privacy-safe analytics`.

---

### Task 14: KVKK, hesap silme, güvenlik başlıkları

**Files:**
- Create: `src/features/legal/PrivacyPage.tsx`, `src/features/account/AccountPage.tsx`, `src/features/account/AccountPage.test.tsx`, `public/_headers`, `e2e/privacy.spec.ts`
- Modify: `src/services/auth.ts`

**Interfaces:**
- Consumes: `deleteCurrentAccount`, `AuthUser`

- [ ] **Adım 1: Failing test yaz**

```tsx
it("hesap silme onay ister", async () => {
  renderAccount(); await user.click(screen.getByRole("button",{name:"Hesabımı sil"}));
  expect(deleteCurrentAccount).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button",{name:"Evet, sil"}));
  expect(deleteCurrentAccount).toHaveBeenCalledOnce();
});
```

```ts
// e2e/privacy.spec.ts: uçtan uca akışta ağa görüntü çıkmaz
test("fotoğraf ağ isteğine girmez", async ({ page }) => {
  const requests = captureRequests(page);
  await runFlowToDownload(page, "portrait.jpg");
  expect(requests.filter(r => r.bodySize > 50_000 || /image\//.test(r.requestContentType))).toEqual([]);
});
```

- [ ] **Adım 2:** Testi çalıştır. Beklenen: FAIL.
- [ ] **Adım 3:** Hesap silme `demand`, `users` belgelerini ve Authentication kaydını siler; yeniden kimlik doğrulama gerekirse bunu kullanıcıya söyler. Aydınlatma metni taslağı açıkça "hukuki inceleme bekliyor" olarak işaretlenir ve yayından önce uzman onayı gerektirir.
- [ ] **Adım 4:** `public/_headers` içinde CSP: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://apis.google.com; connect-src 'self' https://*.googleapis.com https://eu.i.posthog.com; frame-src https://*.firebaseapp.com; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; font-src 'self'`.
- [ ] **Adım 5:** `npx vitest run src/features/account` ve `npx playwright test e2e/privacy.spec.ts` çalıştır. Beklenen: PASS.
- [ ] **Adım 6:** Commit: `feat: add privacy page, account deletion and CSP`.

---

### Task 15: Uçtan uca test, gerçek cihaz ve yayın

**Files:**
- Create: `e2e/flow.spec.ts`, `docs/cihaz-kontrol-listesi.md`, `.github/workflows/ci.yml`

- [ ] **Adım 1: Uçtan uca testi yaz**

```ts
test("galeri > fotoğraf > stil > sonuç > giriş > indirme", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button",{name:/70'ler/}).first().click();
  await page.setInputFiles("input[type=file]","e2e/fixtures/portrait.jpg");
  await page.getByRole("button",{name:"70'lere gönder"}).click();
  await expect(page.getByRole("heading",{name:/hoş geldin/})).toBeVisible();
  await page.getByRole("button",{name:"İndir"}).click();
  await emulatorEmailLogin(page);
  const d = await page.waitForEvent("download");
  expect(d.suggestedFilename()).toMatch(/^kilik-.*\.jpg$/);
});
```

- [ ] **Adım 2:** `npx playwright test` çalıştır, kırılanları düzelt. Beklenen: tüm testler PASS.
- [ ] **Adım 3:** CI: `npm ci`, `tsc --noEmit`, `vitest run`, Playwright.
- [ ] **Adım 4:** Firebase ve PostHog projelerini ücretsiz planda kullanıcıyla birlikte kur; kotaları ve Cloudflare ticari kullanım koşulunu resmî sayfalardan doğrula.
- [ ] **Adım 5:** Gerçek cihaz listesini tamamla: iPhone Safari, Android Chrome, Instagram ve TikTok tarayıcıları; 9 stil, 3 format, indirme, paylaşma, giriş. Sayfada hata ve cihaz bilgisini kopyalanabilir metin olarak gösteren geçici bir tanılama ekranı sağla; kullanıcı sonuçları buradan iletir.
- [ ] **Adım 6:** `run` skill ile uygulamayı aç; `security-review` ve `code-review` çalıştır, bulguları düzelt.
- [ ] **Adım 7:** Yayın öncesi kapı: hukuki metin onayı alınmadan herkese açık yayın yapılmaz. Onay sonrası `wrangler pages deploy dist`, yayın adresini kullanıcıyla doğrula.
- [ ] **Adım 8:** Commit: `chore: add e2e flow, CI and release checklist`, ardından `superpowers:finishing-a-development-branch`.
