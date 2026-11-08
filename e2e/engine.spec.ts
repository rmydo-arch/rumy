import { expect, test, type Page } from "@playwright/test";

type Harness = {
  render(o?: object): Promise<{ width: number; height: number; type: string }>;
  sample(o: object, pts: [number, number][]): Promise<number[][]>;
  renderHash(v: string, o?: object): Promise<number>;
  renderNonBlank(): Promise<boolean>;
  loseContext(): Promise<void>;
};
declare global { interface Window { harness: Harness } }

async function open(page: Page) {
  await page.goto("/src/dev/engine-harness.html");
  await page.waitForFunction(() => document.title === "ready");
}
const renderInHarness = async (page: Page, o: object) => { await open(page); return page.evaluate((x) => window.harness.render(x), o); };
const renderHash = async (page: Page, v: string, o: object = {}) => { await open(page); return page.evaluate(([x, y]) => window.harness.renderHash(x, y), [v, o] as [string, object]); };
const loseContext = async (page: Page) => { await open(page); await page.evaluate(() => window.harness.loseContext()); };
const renderNonBlank = (page: Page) => page.evaluate(() => window.harness.renderNonBlank());

test("export istenen boyutta JPEG üretir", async ({ page }) => {
  const r = await renderInHarness(page, { format: "story", quality: "export" });
  expect([r.width, r.height, r.type]).toEqual([1152, 2048, "image/jpeg"]);
});

test("varyasyonlar farklı pikseller üretir", async ({ page }) => {
  expect(await renderHash(page, "ozgun")).not.toEqual(await renderHash(page, "solgun"));
});

test("aynı girdi aynı pikselleri üretir", async ({ page }) => {
  expect(await renderHash(page, "ozgun")).toEqual(await renderHash(page, "ozgun"));
});

test("WebGL bağlamı kaybolunca yeniden işler", async ({ page }) => {
  await loseContext(page);
  expect(await renderNonBlank(page)).toBe(true);
});

test("üst üste gelen işlemler kendi sonuçlarını döndürür", async ({ page }) => {
  await open(page);
  const sizes = await page.evaluate(() =>
    Promise.all([window.harness.render({ format: "story" }), window.harness.render({ format: "kare" }), window.harness.render({ format: "post" })]),
  );
  expect(sizes.map((s) => [s.width, s.height])).toEqual([[405, 720], [720, 720], [576, 720]]);
});

// story preview is 405x720 from a 1200x800 source: crop x 375..825, centered black disc of radius 100 source px (90 output px)
const near = (c: number[], want: [number, number, number]) => c.every((v, i) => Math.abs(v - want[i]) < 70);
const sample = (page: Page, pts: [number, number][], o: object = {}) => page.evaluate(([p, x]) => window.harness.sample(x, p), [pts, { format: "story", ...o }] as [[number, number][], object]);

test("görüntü doğru yönde ve kırpmada", async ({ page }) => {
  await open(page);
  const [tl, tr, bl, br, c] = await sample(page, [[20, 20], [385, 20], [20, 700], [385, 700], [202, 360]]);
  expect(near(tl, [224, 0, 0])).toBe(true); // red top-left
  expect(near(tr, [0, 192, 0])).toBe(true); // green top-right: not mirrored
  expect(near(bl, [224, 224, 0])).toBe(true); // yellow bottom-left: not flipped
  expect(near(br, [0, 0, 224])).toBe(true); // blue bottom-right
  expect(near(c, [0, 0, 0])).toBe(true);
});

test("kırpma ortadan, bozulma yok", async ({ page }) => {
  await open(page);
  // disc radius is 90px on both axes when undistorted; probe 70px (inside) and 110px (outside)
  const pts: [number, number][] = [[202 + 70, 360], [202 - 70, 360], [202, 360 + 70], [202, 360 - 70], [202 + 110, 360], [202, 360 + 110]];
  const [r, l, d, u, ro, dO] = await sample(page, pts);
  for (const p of [r, l, d, u]) expect(near(p, [0, 0, 0])).toBe(true);
  for (const p of [ro, dO]) expect(p.some((v) => v > 120)).toBe(true);
  // bands outside the crop never appear at the edges
  const edge = await sample(page, [[2, 360], [402, 360], [2, 100], [402, 600]]);
  for (const p of edge) expect(near(p, [255, 0, 255]) || near(p, [0, 255, 255])).toBe(false);
});

test("şablon kilitli formatta üretilir", async ({ page }) => {
  const r = await renderInHarness(page, { style: "plak", format: "kare", quality: "export", title: "Şarkılar" });
  expect([r.width, r.height]).toEqual([2048, 2048]);
});

test("başlık çıktıyı değiştirir", async ({ page }) => {
  expect(await renderHash(page, "ozgun", { style: "plak", format: "kare", title: "A" })).not.toEqual(await renderHash(page, "ozgun", { style: "plak", format: "kare", title: "B" }));
});

test("üretim ağ isteği yapmaz", async ({ page }) => {
  await open(page);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.evaluate(() => window.harness.render({ style: "anlik", year: 1977, options: ["dateStamp"] }));
  expect(requests).toEqual([]);
});

test("şablon arka planı görünür, fotoğraf kendi alanına oturur", async ({ page }) => {
  await open(page);
  // kare preview 720: plak side margin is cream, photoRect center holds the black disc
  const [margin, center] = await sample(page, [[29, 360], [360, 310]], { style: "plak", format: "kare" });
  expect(near(margin, [244, 231, 207])).toBe(true);
  expect(near(center, [0, 0, 0])).toBe(true);
});

test("anlık film çerçevesi alt kenarda kâğıt rengi bırakır", async ({ page }) => {
  await open(page);
  const [bottom] = await sample(page, [[288, 695]], { style: "anlik" });
  expect(bottom.every((v) => v > 225)).toBe(true);
});

test("tarih damgası çıktıyı değiştirir, yıl yoksa çizilmez", async ({ page }) => {
  const off = await renderHash(page, "ozgun", { year: 1977 });
  expect(await renderHash(page, "ozgun", { year: 1977, options: ["dateStamp"] })).not.toEqual(off);
  expect(await renderHash(page, "ozgun", { options: ["dateStamp"] })).toEqual(off);
});

test("Solgun kırmızıyı soluklaştırır", async ({ page }) => {
  await open(page);
  const [[r1, g1]] = await sample(page, [[20, 20]], { variant: "ozgun" });
  const [[r2, g2]] = await sample(page, [[20, 20]], { variant: "solgun" });
  expect(r2 - g2).toBeLessThan((r1 - g1) - 20);
});
