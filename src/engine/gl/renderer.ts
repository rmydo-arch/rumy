import type { GradeSettings } from "../../concepts/types";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

export interface Crop { x: number; y: number; w: number; h: number; }

/** Owns one canvas, one WebGL2 context and its GPU resources (program, buffer, photo texture). */
export class GlRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private uploaded: ImageBitmap | null = null;
  private lost = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
    });
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, alpha: false, antialias: false });
    if (!gl) throw new Error("webgl_unavailable");
    this.gl = gl;
    this.program = this.link(VERTEX_SHADER, FRAGMENT_SHADER);
    gl.useProgram(this.program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }

  get isDead(): boolean {
    return this.lost || this.gl.isContextLost();
  }

  draw(bitmap: ImageBitmap, crop: Crop, width: number, height: number, grade: GradeSettings): void {
    const gl = this.gl;
    if (this.uploaded !== bitmap) {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.uploaded = bitmap;
    }
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    gl.viewport(0, 0, width, height);

    gl.uniform4f(this.u("uCrop"), crop.x / bitmap.width, crop.y / bitmap.height, crop.w / bitmap.width, crop.h / bitmap.height);
    gl.uniform2f(this.u("uSize"), width, height);
    gl.uniform1f(this.u("uSaturation"), grade.saturation);
    gl.uniform1f(this.u("uContrast"), grade.contrast);
    gl.uniform1f(this.u("uBrightness"), grade.brightness);
    gl.uniform1f(this.u("uWarmth"), grade.warmth);
    gl.uniform1f(this.u("uFade"), grade.fade);
    gl.uniform1f(this.u("uGrain"), grade.grain);
    gl.uniform1f(this.u("uVignette"), grade.vignette);
    gl.uniform1f(this.u("uLeak"), grade.leak);
    gl.uniform1i(this.u("uMono"), grade.mono ? 1 : 0);
    gl.uniform1i(this.u("uPhoto"), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Forget the uploaded-bitmap marker when its bitmap is closed. */
  release(bitmap: ImageBitmap): void {
    if (this.uploaded === bitmap) this.uploaded = null;
  }

  private u(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) this.uniforms.set(name, this.gl.getUniformLocation(this.program, name));
    return this.uniforms.get(name) ?? null;
  }

  private compile(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`webgl_shader: ${info}`);
    }
    return shader;
  }

  private link(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const program = gl.createProgram();
    gl.attachShader(program, this.compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`webgl_link: ${gl.getProgramInfoLog(program)}`);
    }
    return program;
  }
}
