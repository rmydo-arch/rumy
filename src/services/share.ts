import type { FormatId } from "../concepts/types";

export interface ShareEnv {
  canShare(data: ShareData): boolean;
  share?(data: ShareData): Promise<void>;
  download(blob: Blob, filename: string): void;
}

function browserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // iOS Safari reads the URL after click returns
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const browserEnv: ShareEnv = {
  canShare: (data) => typeof navigator.canShare === "function" && navigator.canShare(data),
  share: (data) => navigator.share(data),
  download: browserDownload,
};

export async function shareOrDownload(
  blob: Blob,
  filename: string,
  mode: "share" | "download",
  env: ShareEnv = browserEnv,
): Promise<"shared" | "downloaded" | "cancelled"> {
  if (mode === "share" && env.share) {
    const data: ShareData = { files: [new File([blob], filename, { type: blob.type })] };
    if (env.canShare(data)) {
      try {
        await env.share(data);
        return "shared";
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      }
    }
  }
  env.download(blob, filename);
  return "downloaded";
}

export function resultFilename(styleId: string, format: FormatId): string {
  return `kilik-${styleId}-${format}.jpg`;
}
