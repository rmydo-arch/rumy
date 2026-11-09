import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5199, host: '127.0.0.1' } });
await server.listen();
const url = 'https://127.0.0.1:5199/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const external = [];
page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== new URL(url).origin && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
await page.goto(url);
// Generate a 3000x2000 gradient test PNG (no person) in the browser.
const b64 = await page.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 3000; c.height = 2000;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 3000, 2000);
  gr.addColorStop(0, '#2a6'); gr.addColorStop(1, '#fa3'); g.fillStyle = gr; g.fillRect(0, 0, 3000, 2000);
  return c.toDataURL('image/png').split(',')[1];
});
let ok = true;
for (const edge of ['2048', '1536', '1024']) {
  await page.setInputFiles('#file', { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => /Render süresi|HATA/.test(document.getElementById('log').textContent), null, { timeout: 120000 });
  await page.selectOption('#edge', edge);
  await page.click('#export');
  await page.waitForFunction((n) => (document.getElementById('log').textContent.match(/Çıktı:/g) || []).length >= n || /HATA/.test(document.getElementById('log').textContent), edge === '2048' ? 1 : edge === '1536' ? 2 : 3, { timeout: 60000 });
}
const log = await page.textContent('#log');
console.log(log);
const errors = /HATA/.test(log);
const sizes = [...log.matchAll(/Çıktı: (\d+)x(\d+), (\d+) bayt \(image\/jpeg\)/g)].map((m) => m.slice(1, 3).join('x'));
console.log('sizes:', sizes, 'external requests:', external);
const expected = ['2048x1365', '1536x1024', '1024x683'];
ok = !errors && JSON.stringify(sizes.slice(-3)) === JSON.stringify(expected) && external.length === 0;
console.log(ok ? 'SMOKE OK' : 'SMOKE FAIL');
await browser.close(); await server.close();
process.exit(ok ? 0 : 1);
