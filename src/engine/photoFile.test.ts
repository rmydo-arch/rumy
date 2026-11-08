import { validatePhotoFile } from "./photoFile";

function file(name: string, type: string, size: number): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

describe("validatePhotoFile", () => {
  it("HEIC reddedilir", () => expect(validatePhotoFile(file("a.heic", "image/heic", 100))).toBe("unsupported"));
  it("20 MB kabul edilir", () => expect(validatePhotoFile(file("a.jpg", "image/jpeg", 20 * 1024 * 1024))).toBeNull());
  it("20 MB + 1 bayt reddedilir", () => expect(validatePhotoFile(file("a.jpg", "image/jpeg", 20 * 1024 * 1024 + 1))).toBe("tooLarge"));
  it("boş dosya bozuk sayılır", () => expect(validatePhotoFile(file("a.jpg", "image/jpeg", 0))).toBe("corrupt"));
  it("png ve webp kabul edilir", () => {
    expect(validatePhotoFile(file("a.png", "image/png", 10))).toBeNull();
    expect(validatePhotoFile(file("a.webp", "image/webp", 10))).toBeNull();
  });
});
