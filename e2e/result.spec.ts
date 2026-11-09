import { expect, test } from "@playwright/test";

test("stilden sonuca gidilir, sonuç doğru adla indirilir", async ({ page }) => {
  await page.goto("/k/retro-70/foto");
  await page.setInputFiles("input[type=file]", "e2e/fixtures/exif-rotated.jpg");
  await page.getByRole("button", { name: "70'lere gönder" }).click();

  await expect(page.getByRole("heading", { name: "1977'ye hoş geldin" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Sonuç" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "İndir" }).click();
  expect((await download).suggestedFilename()).toBe("kilik-anlik-post.jpg");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("sonuç ekranı yenilenince çökmeden fotoğraf seçimine döner", async ({ page }) => {
  await page.goto("/k/retro-70/foto");
  await page.setInputFiles("input[type=file]", "e2e/fixtures/exif-rotated.jpg");
  await page.getByRole("button", { name: "70'lere gönder" }).click();
  await expect(page.getByRole("img", { name: "Sonuç" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/k\/retro-70\/foto$/);
  await expect(page.getByRole("heading", { name: "Hangi fotoğraf 70'lere gitsin?" })).toBeVisible();
});

test("geri tuşu sonuçtan stil ekranına döner", async ({ page }) => {
  await page.goto("/k/retro-70/foto");
  await page.setInputFiles("input[type=file]", "e2e/fixtures/exif-rotated.jpg");
  await page.getByRole("button", { name: "70'lere gönder" }).click();
  await expect(page.getByRole("img", { name: "Sonuç" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/k\/retro-70\/stil$/);
  await expect(page.getByRole("img", { name: "Önizleme" })).toBeVisible();
});
