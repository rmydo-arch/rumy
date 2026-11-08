import { vi } from "vitest";
import { resultFilename, shareOrDownload } from "./share";

const blob = new Blob(["x"], { type: "image/jpeg" });
const download = vi.fn();

beforeEach(() => download.mockClear());

describe("shareOrDownload", () => {
  it("paylaşım desteklenmiyorsa indirir", async () => {
    expect(await shareOrDownload(blob, "a.jpg", "share", { canShare: () => false, download })).toBe("downloaded");
    expect(download).toHaveBeenCalledWith(blob, "a.jpg");
  });
  it("kullanıcı paylaşımı iptal ederse indirmez", async () => {
    const share = () => Promise.reject(new DOMException("x", "AbortError"));
    expect(await shareOrDownload(blob, "a.jpg", "share", { canShare: () => true, share, download })).toBe("cancelled");
    expect(download).not.toHaveBeenCalled();
  });
  it("paylaşım başarılıysa dosyayla paylaşır, indirmez", async () => {
    const share = vi.fn(async (_data: ShareData) => undefined);
    expect(await shareOrDownload(blob, "a.jpg", "share", { canShare: () => true, share, download })).toBe("shared");
    const [file] = share.mock.lastCall![0].files!;
    expect(file.name).toBe("a.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(download).not.toHaveBeenCalled();
  });
  it("paylaşım başka nedenle başarısızsa indirir", async () => {
    const share = () => Promise.reject(new DOMException("x", "NotAllowedError"));
    expect(await shareOrDownload(blob, "a.jpg", "share", { canShare: () => true, share, download })).toBe("downloaded");
    expect(download).toHaveBeenCalledOnce();
  });
  it("indirme kipi paylaşımı denemez", async () => {
    const share = vi.fn();
    expect(await shareOrDownload(blob, "a.jpg", "download", { canShare: () => true, share, download })).toBe("downloaded");
    expect(share).not.toHaveBeenCalled();
  });
});

it("dosya adı", () => expect(resultFilename("anlik", "post")).toBe("kilik-anlik-post.jpg"));
