import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function decodeFixtureInPage(page: Page, name: string) {
  await page.goto("/");
  const data = readFileSync(join(import.meta.dirname, "fixtures", name)).toString("base64");
  return page.evaluate(async (b64) => {
    const { decodePhoto } = await import("/src/engine/photoFile.ts");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bitmap = await decodePhoto(new Blob([bytes], { type: "image/jpeg" }), 2048);
    return { width: bitmap.width, height: bitmap.height };
  }, data);
}

test("EXIF ile döndürülmüş fotoğraf dik çözülür", async ({ page }) => {
  const size = await decodeFixtureInPage(page, "exif-rotated.jpg");
  expect(size.height).toBeGreaterThan(size.width);
});
