import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const W = 80, H = 40;
const browser = await chromium.launch();
const page = await browser.newPage();
const b64 = await page.evaluate(async ([w, h]) => {
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext("2d");
  g.fillStyle = "#BF4316"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#F7F1E4"; g.fillRect(0, 0, w / 2, h / 2);
  const buf = new Uint8Array(await (await c.convertToBlob({ type: "image/jpeg", quality: 0.9 })).arrayBuffer());
  let s = ""; for (const b of buf) s += String.fromCharCode(b);
  return btoa(s);
}, [W, H]);
await browser.close();

const jpeg = Buffer.from(b64, "base64");
// APP1 Exif, big-endian TIFF, one IFD0 entry: Orientation (0x0112) SHORT = 6
const tiff = Buffer.from([0x4d,0x4d,0x00,0x2a,0,0,0,8, 0,1, 0x01,0x12,0,3,0,0,0,1,0,6,0,0, 0,0,0,0]);
const body = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]);
const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 0xff]), body]);
const out = Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);

// Stored (pre-EXIF) size comes from the SOF0 segment and must be landscape.
const sof = out.indexOf(Buffer.from([0xff, 0xc0]));
const storedH = out.readUInt16BE(sof + 5), storedW = out.readUInt16BE(sof + 7);
if (!(storedW > storedH)) throw new Error(`fixture is not landscape: ${storedW}x${storedH}`);
writeFileSync(fileURLToPath(new URL("./exif-rotated.jpg", import.meta.url)), out);
console.log("wrote exif-rotated.jpg", storedW, storedH);
