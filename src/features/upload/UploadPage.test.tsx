import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import * as photoFile from "../../engine/photoFile";
import { BrowserRouter } from "react-router-dom";
import { App } from "../../app/App";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

function deferredDecode() {
  let resolve!: (b: ImageBitmap) => void;
  const promise = new Promise<ImageBitmap>((r) => (resolve = r));
  vi.spyOn(photoFile, "decodePhoto").mockReturnValue(promise);
  return resolve;
}

const bitmap = () => ({ width: 10, height: 20, close: vi.fn() }) as unknown as ImageBitmap;

describe("UploadPage", () => {
  it("cihazdan çıkmaz bilgisini gösterir", () => {
    renderAt("/k/retro-70/foto");
    expect(screen.getByText("Fotoğrafların cihazından çıkmaz.")).toBeInTheDocument();
  });
  it("izin uyarısını gösterir", () => {
    renderAt("/k/retro-70/foto");
    expect(screen.getByText(/izin aldığın kişilerinkini/)).toBeInTheDocument();
  });
  it("konsept başlığını gösterir", () => {
    renderAt("/k/retro-70/foto");
    expect(screen.getByRole("heading", { name: "Hangi fotoğraf 70'lere gitsin?" })).toBeInTheDocument();
  });
  it("canlı olmayan konsept galeriye döner", () => {
    renderAt("/k/retro-80/foto");
    expect(window.location.pathname).toBe("/");
  });

  describe("çözme sürerken", () => {
    afterEach(() => vi.restoreAllMocks());

    it("sayfa kapanınca biten çözme bitmap'i kapatır, yönlendirmez", async () => {
      const resolve = deferredDecode();
      const { unmount } = renderAt("/k/retro-70/foto");
      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, new File(["x"], "a.jpg", { type: "image/jpeg" }));
      await screen.findByText("Fotoğraf hazırlanıyor");
      unmount();
      const bm = bitmap();
      await act(async () => resolve(bm));
      expect(bm.close).toHaveBeenCalledTimes(1);
      expect(window.location.pathname).toBe("/k/retro-70/foto");
    });

    it("kullanıcı ayrılınca yönlendirmez ve bitmap'i kapatır", async () => {
      const resolve = deferredDecode();
      renderAt("/k/retro-70/foto");
      const input = document.querySelector("input[type=file]") as HTMLInputElement;
      await userEvent.upload(input, new File(["x"], "a.jpg", { type: "image/jpeg" }));
      await userEvent.click(screen.getByRole("button", { name: "Konseptlere dön" }));
      const bm = bitmap();
      await act(async () => resolve(bm));
      await waitFor(() => expect(bm.close).toHaveBeenCalledTimes(1));
      expect(window.location.pathname).toBe("/");
    });
  });
});
