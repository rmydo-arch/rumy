import { expect, test } from "@playwright/test";

test("başlık yazı tipi Türkçe harflerin tamamını içerir", async ({ page }) => {
  await page.goto("/k/retro-70/foto");
  const missing = await page.evaluate(async () => {
    const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-display");
    const family = stack.split(",")[0].trim();
    const weight = getComputedStyle(document.querySelector("h1")!).fontWeight;
    const letters = [..."şŞğĞıİçÇöÖüÜ"];
    await document.fonts.load(`${weight} 100px ${family}`, letters.join(""));
    const ctx = document.createElement("canvas").getContext("2d")!;
    const width = (font: string, ch: string) => {
      ctx.font = `${weight} 100px ${font}`;
      return ctx.measureText(ch).width;
    };
    return letters.filter(
      (ch) => width(`${family}, monospace`, ch) === width("monospace", ch) && width(`${family}, serif`, ch) === width("serif", ch),
    );
  });
  expect(missing).toEqual([]);
});
