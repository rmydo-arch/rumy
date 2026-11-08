// Downloads the model and copies MediaPipe WASM into public/ so everything is same-origin.
import { mkdir, cp, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
await mkdir('public/models', { recursive: true });
const modelPath = 'public/models/selfie_multiclass_256x256.tflite';
if (!existsSync(modelPath) || (await stat(modelPath)).size < 1e5) {
  const r = await fetch(MODEL_URL);
  if (!r.ok) throw new Error('model download failed: ' + r.status);
  await writeFile(modelPath, Buffer.from(await r.arrayBuffer()));
  console.log('model downloaded');
}
if (existsSync('node_modules/@mediapipe/tasks-vision/wasm')) {
  await cp('node_modules/@mediapipe/tasks-vision/wasm', 'public/wasm', { recursive: true });
  console.log('wasm copied');
} else console.warn('tasks-vision not installed yet; run npm run setup after install');
