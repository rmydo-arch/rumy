import { MAX_FILE_BYTES } from "./limits";

export type PhotoError = "unsupported" | "tooLarge" | "corrupt";

export const photoErrorMessage: Record<PhotoError, string> = {
  unsupported: "Bu dosya desteklenmiyor. JPG, PNG ya da WEBP seç.",
  tooLarge: "Bu fotoğraf 20 MB'tan büyük. Daha küçük bir dosya seç.",
  corrupt: "Fotoğraf okunamadı. Başka bir dosya dene.",
};

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePhotoFile(file: File): PhotoError | null {
  if (!ACCEPTED.has(file.type)) return "unsupported";
  if (file.size === 0) return "corrupt";
  if (file.size > MAX_FILE_BYTES) return "tooLarge";
  return null;
}

export async function decodePhoto(photo: Blob, maxEdge: number): Promise<ImageBitmap> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("corrupt");
  }
  const longEdge = Math.max(bitmap.width, bitmap.height);
  if (longEdge <= maxEdge) return bitmap;
  const scale = maxEdge / longEdge;
  try {
    const scaled = await createImageBitmap(bitmap, {
      resizeWidth: Math.max(1, Math.round(bitmap.width * scale)),
      resizeHeight: Math.max(1, Math.round(bitmap.height * scale)),
      resizeQuality: "high",
    });
    return scaled;
  } catch {
    throw new Error("corrupt");
  } finally {
    bitmap.close();
  }
}
