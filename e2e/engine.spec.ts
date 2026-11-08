import { expect, test, type Page } from "@playwright/test";

type Harness = {
  render(o?: object): Promise<{ width: number; height: number; type: string }>;
  renderHash(v: string): Promise<number>;
  renderNonBlank(): Promise<boolean>;
  loseContext(): Promise<void>;
};
declare global { interface Window { harness: Harness } }

async function open(page: Page) {
  await page.goto("/src/dev/engine-harness.html");
  await page.waitForFunction(() => document.title === "ready");
}
const renderInHarness = async (page: Page, o: object) => { await open(page); return page.evaluate((x) => window.harness.render(x), o); };
const renderHash = async (page: Page, v: string) => { await open(page); return page.evaluate((x) => window.harness.renderHash(x), v); };
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
