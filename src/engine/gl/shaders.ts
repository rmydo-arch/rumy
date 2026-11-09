export const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
uniform vec4 uCrop; // x, y, w, h in normalized source coordinates
out vec2 vUv;
out vec2 vTex;
void main() {
  vUv = aPos * 0.5 + 0.5;
  // image row 0 is the top; clip-space y grows upward
  vTex = vec2(uCrop.x + vUv.x * uCrop.z, uCrop.y + (1.0 - vUv.y) * uCrop.w);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vTex;
uniform sampler2D uPhoto;
uniform vec2 uSize;
uniform float uSaturation, uContrast, uBrightness, uWarmth, uFade, uGrain, uVignette, uLeak;
uniform int uMono;
out vec4 outColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 c = texture(uPhoto, vTex).rgb;
  c *= uBrightness;
  c = (c - 0.5) * uContrast + 0.5;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, uSaturation);
  c += vec3(uWarmth, uWarmth * 0.2, -uWarmth);
  c = c * (1.0 - uFade * 0.35) + uFade * 0.35;
  // light leak: warm glow from the left edge
  float leak = uLeak * (1.0 - smoothstep(0.0, 0.5, vUv.x));
  c += vec3(1.0, 0.45, 0.1) * leak * 0.6;
  // vignette
  float d = distance(vUv, vec2(0.5));
  c *= 1.0 - uVignette * smoothstep(0.3, 0.75, d);
  // deterministic grain: seed comes from the pixel position only
  float n = hash(floor(vUv * uSize)) - 0.5;
  c += n * uGrain * 0.5;
  if (uMono == 1) c = vec3(dot(c, vec3(0.2126, 0.7152, 0.0722)));
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
