import { expect, test } from "@playwright/test";

test("stil ekranı gerçek motorla önizleme üretir ve stil değişince yeniler", async ({ page }) => {
  await page.goto("/k/retro-70/foto");
  await page.setInputFiles("input[type=file]", "e2e/fixtures/exif-rotated.jpg");
  await expect(page).toHaveURL(/\/k\/retro-70\/stil$/);

  const preview = page.getByRole("img", { name: "Önizleme" });
  await expect(preview).toBeVisible();
  const first = await preview.getAttribute("src");

  await page.getByRole("button", { name: "Sıcak Slayt Filmi" }).click();
  await expect.poll(() => preview.getAttribute("src")).not.toBe(first);
  await expect(page.getByRole("alert")).toHaveCount(0);

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
});
