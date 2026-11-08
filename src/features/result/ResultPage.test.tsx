import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { paths } from "../../app/routes";
import type { RenderResult } from "../../engine/types";
import * as share from "../../services/share";
import { fakeEngine, fakePhoto, renderPage, stubObjectUrls, type Setup } from "../../test-utils/session";
import { ResultPage } from "./ResultPage";

const user = userEvent.setup();
const drawImage = vi.fn();
const renderAt = (url: string, setup?: Setup) => renderPage(url, paths.result(":id"), <ResultPage />, setup);
const renderResult = (setup?: Setup) => renderAt("/k/retro-70/sonuc", setup);

function deferredEngine() {
  const finish: ((type: string) => void)[] = [];
  const engine = fakeEngine();
  engine.render.mockImplementation(
    () => new Promise<RenderResult>((resolve) => finish.push((type) => resolve({ blob: new Blob([], { type }), width: 1, height: 1 }))),
  );
  return { engine, finish };
}

beforeEach(() => {
  stubObjectUrls();
  drawImage.mockClear();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage })) as never;
});
afterEach(() => vi.restoreAllMocks());

describe("ResultPage", () => {
  it("varyasyon seçilince yeniden işler", async () => {
    const engine = fakeEngine();
    await renderResult({ engine });
    await user.click(screen.getByRole("button", { name: "Solgun" }));
    expect(engine.render).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ variant: "solgun" }));
    expect(screen.getByRole("button", { name: "Solgun" })).toHaveAttribute("aria-pressed", "true");
  });
  it("sonuç başlığı yıl ekiyle yazılır", async () => {
    await renderResult({ selection: { year: 1977 } });
    expect(screen.getByRole("heading", { name: "1977'ye hoş geldin" })).toBeInTheDocument();
  });
  it("yeniden yüklemede fotoğraf yoksa seçime döner", async () => {
    await renderAt("/k/retro-70/sonuc", { photo: null });
    expect(window.location.pathname).toBe("/k/retro-70/foto");
  });
  it("canlı olmayan konsept galeriye döner", async () => {
    await renderAt("/k/cizgi/sonuc");
    expect(window.location.pathname).toBe("/");
  });
  it("WebGL yoksa açıklama gösterir", async () => {
    const engine = fakeEngine();
    engine.render.mockRejectedValue(new Error("webgl_unavailable"));
    await renderResult({ engine });
    expect(await screen.findByRole("alert")).toHaveTextContent("Bu cihaz görsel işlemeyi desteklemiyor.");
  });
  it("dışa aktarma kalitesinde işler", async () => {
    const engine = fakeEngine();
    await renderResult({ engine });
    expect(engine.render).toHaveBeenLastCalledWith(fakePhoto, expect.objectContaining({ quality: "export" }));
  });
  it("işlem sürerken işleme panelini gösterir, bitince sonucu", async () => {
    const { engine, finish } = deferredEngine();
    await renderResult({ engine });
    expect(screen.getByRole("heading", { name: "Karanlık odada banyo ediliyor" })).toBeInTheDocument();
    await act(async () => finish[0]("image/done"));
    expect(screen.queryByRole("heading", { name: "Karanlık odada banyo ediliyor" })).toBeNull();
    expect(screen.getByRole("img", { name: "Sonuç" })).toHaveAttribute("src", "blob:image/done");
  });
  it("işlem sırasında vazgeçilince stile döner", async () => {
    const { engine } = deferredEngine();
    await renderResult({ engine });
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(window.location.pathname).toBe("/k/retro-70/stil");
  });
  it("İndir sonucu seçili stil ve formatla indirir", async () => {
    const spy = vi.spyOn(share, "shareOrDownload").mockResolvedValue("downloaded");
    await renderResult();
    await user.click(screen.getByRole("button", { name: "İndir" }));
    expect(spy).toHaveBeenCalledWith(expect.any(Blob), "kilik-anlik-post.jpg", "download");
  });
  it("Paylaş paylaşım kipiyle çağırır", async () => {
    const spy = vi.spyOn(share, "shareOrDownload").mockResolvedValue("shared");
    await renderResult();
    await user.click(screen.getByRole("button", { name: "Paylaş" }));
    expect(spy).toHaveBeenCalledWith(expect.any(Blob), "kilik-anlik-post.jpg", "share");
  });
  it("yeni varyasyon hazırlanırken eski dosya indirilemez", async () => {
    const { engine, finish } = deferredEngine();
    await renderResult({ engine });
    await act(async () => finish[0]("image/first"));
    await user.click(screen.getByRole("button", { name: "Canlı" }));
    expect(screen.getByRole("button", { name: "İndir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Paylaş" })).toBeDisabled();
    await act(async () => finish[1]("image/second"));
    expect(screen.getByRole("button", { name: "İndir" })).toBeEnabled();
  });
  it("karşılaştırmada özgün fotoğraf kırpılarak çizilir ve kaydırıcı klavyeyle kullanılır", async () => {
    await renderResult();
    expect(drawImage).toHaveBeenCalledWith(fakePhoto.bitmap, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number), 0, 0, 576, 720);
    const slider = screen.getByRole("slider", { name: "Önce ve sonra karşılaştırması" });
    fireEvent.change(slider, { target: { value: "30" } });
    expect(slider).toHaveValue("30");
  });
  it.each([
    ["Stile dön", "/k/retro-70/stil"],
    ["Yeni fotoğraf", "/k/retro-70/foto"],
    ["Başka konsept", "/"],
  ])("%s doğru ekrana götürür", async (name, path) => {
    await renderResult();
    await user.click(screen.getByRole("button", { name }));
    expect(window.location.pathname).toBe(path);
  });
});
