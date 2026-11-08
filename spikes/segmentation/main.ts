import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const logEl = $<HTMLPreElement>('log');
function log(msg: string) { logEl.textContent += msg + '\n'; console.log(msg); }
function err(where: string, e: unknown) { log(`HATA [${where}]: ${e instanceof Error ? e.name + ': ' + e.message : String(e)}`); }
window.onerror = (m, s, l, c) => { log(`HATA [window.onerror]: ${m} @${s}:${l}:${c}`); };
window.addEventListener('unhandledrejection', (e) => err('unhandledrejection', e.reason));

log('UA: ' + navigator.userAgent);
const canvas = $<HTMLCanvasElement>('out');
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); log('HATA [webglcontextlost]'); });
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false });
log('WebGL2: ' + (gl ? 'var' : 'YOK'));
const testFile = new File([new Blob(['x'])], 'x.jpg', { type: 'image/jpeg' });
log('canShare(files): ' + !!(navigator.canShare && navigator.canShare({ files: [testFile] })));

const t = () => performance.now();
let segmenter: ImageSegmenter | null = null;
let bitmap: ImageBitmap | null = null;
let maskTex: Uint8Array | null = null;
let maskW = 0, maskH = 0;
let lastBlob: Blob | null = null;

async function loadModel() {
  const t0 = t();
  const fileset = await FilesetResolver.forVisionTasks('/wasm');
  const make = (delegate: 'GPU' | 'CPU') => ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: '/models/selfie_multiclass_256x256.tflite', delegate },
    runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: false,
  });
  let used = 'GPU';
  try { segmenter = await make('GPU'); } catch (e) { err('GPU delegate', e); used = 'CPU'; segmenter = await make('CPU'); }
  log(`Model yükleme: ${(t() - t0).toFixed(0)} ms (delegate ${used})`);
}

const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*0.5+0.5; uv.y = 1.0-uv.y; gl_Position = vec4(p,0,1); }`;
const FS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D img; uniform sampler2D mask; uniform vec3 bg; uniform float bright; uniform float sat;
void main(){
  vec3 c = texture(img, uv).rgb;
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  vec3 adj = clamp(mix(vec3(l), c, sat) * bright, 0.0, 1.0);
  float m = texture(mask, uv).r;
  o = vec4(mix(bg, adj, m), 1.0);
}`;
let prog: WebGLProgram | null = null;
function sh(type: number, src: string) {
  const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s);
  if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) || 'shader');
  return s;
}
function initGL() {
  prog = gl!.createProgram()!;
  gl!.attachShader(prog, sh(gl!.VERTEX_SHADER, VS)); gl!.attachShader(prog, sh(gl!.FRAGMENT_SHADER, FS));
  gl!.linkProgram(prog);
  if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) throw new Error(gl!.getProgramInfoLog(prog) || 'link');
  gl!.useProgram(prog);
  const b = gl!.createBuffer(); gl!.bindBuffer(gl!.ARRAY_BUFFER, b);
  gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl!.STATIC_DRAW);
  const loc = gl!.getAttribLocation(prog, 'p'); gl!.enableVertexAttribArray(loc); gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
}
function tex(unit: number) {
  const x = gl!.createTexture(); gl!.activeTexture(gl!.TEXTURE0 + unit); gl!.bindTexture(gl!.TEXTURE_2D, x);
  for (const [k, v] of [[gl!.TEXTURE_MIN_FILTER, gl!.LINEAR], [gl!.TEXTURE_MAG_FILTER, gl!.LINEAR], [gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE], [gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE]] as const) gl!.texParameteri(gl!.TEXTURE_2D, k, v);
  return x;
}

// Render at given long edge (image dimensions scaled). Returns rendered width/height.
function render(longEdge: number | null) {
  if (!gl || !bitmap || !maskTex) throw new Error('hazır değil');
  const scale = longEdge ? longEdge / Math.max(bitmap.width, bitmap.height) : Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale)), h = Math.max(1, Math.round(bitmap.height * scale));
  canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  tex(0); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
  tex(1); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, maskW, maskH, 0, gl.RED, gl.UNSIGNED_BYTE, maskTex);
  gl.uniform1i(gl.getUniformLocation(prog!, 'img'), 0); gl.uniform1i(gl.getUniformLocation(prog!, 'mask'), 1);
  const hex = $<HTMLInputElement>('bg').value;
  gl.uniform3f(gl.getUniformLocation(prog!, 'bg'), parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
  gl.uniform1f(gl.getUniformLocation(prog!, 'bright'), +$<HTMLInputElement>('bright').value);
  gl.uniform1f(gl.getUniformLocation(prog!, 'sat'), +$<HTMLInputElement>('sat').value);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
  return { w, h };
}

async function onFile(f: File) {
  try {
    lastBlob = null; for (const id of ['export', 'download', 'share']) $<HTMLButtonElement>(id).disabled = true;
    log(`--- ${f.name} (${f.type}, ${f.size} bayt)`);
    bitmap?.close();
    bitmap = await createImageBitmap(f, { imageOrientation: 'from-image' });
    log(`Görsel: ${bitmap.width}x${bitmap.height}`);
    if (!segmenter) await loadModel();
    let t0 = t();
    // Segment a <=1024px copy: MediaPipe upsamples the mask to input size, so full-res input is wasteful.
    const k = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const small = k < 1 ? await createImageBitmap(bitmap, { resizeWidth: Math.round(bitmap.width * k), resizeHeight: Math.round(bitmap.height * k), resizeQuality: 'high' }) : bitmap;
    t0 = t();
    const res = segmenter!.segment(small);
    if (small !== bitmap) small.close();
    const cm = res.categoryMask!;
    const data = cm.getAsUint8Array();
    maskW = cm.width; maskH = cm.height;
    maskTex = new Uint8Array(data.length);
    let person = 0;
    for (let i = 0; i < data.length; i++) { if (data[i] !== 0) { maskTex[i] = 255; person++; } }
    cm.close();
    log(`Kesim süresi: ${(t() - t0).toFixed(0)} ms (maske ${maskW}x${maskH})`);
    log(`Kişi pikseli: %${(100 * person / data.length).toFixed(2)}`);
    if (!prog) initGL();
    t0 = t(); const r = render(null);
    log(`Render süresi: ${(t() - t0).toFixed(0)} ms (${r.w}x${r.h})`);
    for (const id of ['export', 'download', 'share']) $<HTMLButtonElement>(id).disabled = id !== 'export';
  } catch (e) { err('onFile', e); }
}

async function doExport() {
  try {
    const edge = +$<HTMLSelectElement>('edge').value;
    const t0 = t();
    const r = render(edge);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) throw new Error('toBlob null döndü');
    lastBlob = blob;
    log(`Dışa aktarma süresi: ${(t() - t0).toFixed(0)} ms`);
    log(`Çıktı: ${r.w}x${r.h}, ${blob.size} bayt (${blob.type})`);
    $<HTMLButtonElement>('download').disabled = false; $<HTMLButtonElement>('share').disabled = false;
  } catch (e) { err('export', e); }
}

$<HTMLInputElement>('file').addEventListener('change', (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) onFile(f); });
$<HTMLButtonElement>('export').addEventListener('click', doExport);
for (const id of ['bright', 'sat', 'bg']) $(id).addEventListener('input', () => { try { if (maskTex) render(null); } catch (e) { err('render', e); } });
$<HTMLButtonElement>('download').addEventListener('click', () => {
  if (!lastBlob) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(lastBlob); a.download = 'kesim-testi.jpg'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
});
$<HTMLButtonElement>('share').addEventListener('click', async () => {
  if (!lastBlob) return;
  try {
    const file = new File([lastBlob], 'kesim-testi.jpg', { type: 'image/jpeg' });
    if (!navigator.canShare?.({ files: [file] })) { log('canShare false: dosya paylaşılamıyor'); return; }
    await navigator.share({ files: [file] }); log('Paylaşım tamam');
  } catch (e) { err('share', e); }
});
