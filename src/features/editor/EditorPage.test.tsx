import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { App } from "../../app/App";
import { paths } from "../../app/routes";
import { SessionProvider, useSession } from "../../app/session";
import type { Selection } from "../../concepts/types";
import { EngineProvider } from "../../engine/EngineContext";
import type { EngineCapability, ImageEngine, PreparedPhoto, RenderResult } from "../../engine/types";
import { EditorPage } from "./EditorPage";

const fakePhoto = { bitmap: { close: vi.fn() }, width: 100, height: 200 } as unknown as PreparedPhoto;
const user = userEvent.setup();

function fakeEngine(capabilities: EngineCapability[] = ["grade"]) {
  return {
    id: "fake",
    capabilities: new Set(capabilities),
    prepare: vi.fn(),
    render: vi.fn(async (): Promise<RenderResult> => ({ blob: new Blob([], { type: "image/one" }), width: 1, height: 1 })),
    dispose: vi.fn(),
  } satisfies ImageEngine;
}

function Seed({ photo, selection, children }: { photo: PreparedPhoto | null; selection?: Partial<Selection>; children: ReactNode }) {
  const { setPhoto, updateSelection } = useSession();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setPhoto(photo);
    if (selection) updateSelection(selection);
    setReady(true);
  }, []);
  return ready ? children : null;
}

interface Setup { photo?: PreparedPhoto | null; engine?: ImageEngine; selection?: Partial<Selection>; }

async function renderAt(path: string, { photo = fakePhoto, engine = fakeEngine(), selection }: Setup = {}) {
  window.history.pushState({}, "", path);
  await act(async () => {
    render(
      <BrowserRouter>
        <SessionProvider>
          <EngineProvider engine={engine}>
            <Seed photo={photo} selection={selection}>
              <Routes>
                <Route path={paths.editor(":id")} element={<EditorPage />} />
                <Route path="*" element={null} />
              </Routes>
            </Seed>
          </EngineProvider>
        </SessionProvider>
      </BrowserRouter>,
    );
  });
}

const renderAtTemplate = (engine?: ImageEngine) => renderAt("/k/retro-70/stil", { engine, selection: { styleId: "plak", format: "kare" } });

beforeEach(() => {
  URL.createObjectURL = vi.fn((b: Blob) => `blob:${b.type}`) as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
});

describe("EditorPage", () => {
  it("fotoğraf yoksa fotoğraf seçimine döner", async () => {
    await renderAt("/k/retro-70/stil", { photo: null });
    expect(window.location.pathname).toBe("/k/retro-70/foto");
  });
  it("canlı olmayan konsept galeriye döner", async () => {
    await renderAt("/k/cizgi/stil");
    expect(window.location.pathname).toBe("/");
  });
  it("motorda prompt yoksa prompt alanı görünmez", async () => {
    await renderAt("/k/retro-70/stil", { engine: fakeEngine(["grade"]) });
    expect(screen.queryByLabelText("Prompt")).toBeNull();
  });
  it("motorda prompt varsa prompt alanı görünür", async () => {
    await renderAt("/k/retro-70/stil", { engine: fakeEngine(["grade", "prompt"]) });
    expect(screen.getByLabelText("Prompt")).toBeInTheDocument();
  });
  it("kilitli formatlı şablonda format değişmez", async () => {
    await renderAt("/k/retro-70/stil");
    await user.click(screen.getByRole("button", { name: "Afiş ve kapak" }));
    await user.click(screen.getByRole("button", { name: "Plak Kapağı" }));
    expect(screen.getByRole("button", { name: "Kare 1:1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hikâye 9:16" })).toBeDisabled();
  });
  it("kilitsiz stile dönünce formatlar yeniden seçilebilir", async () => {
    await renderAtTemplate();
    await user.click(screen.getByRole("button", { name: "Film ve albüm" }));
    await user.click(screen.getByRole("button", { name: "Anlık Film" }));
    expect(screen.getByRole("button", { name: "Hikâye 9:16" })).toBeEnabled();
  });
  it("başlık 30 karakterle sınırlı", async () => {
    await renderAtTemplate();
    expect(screen.getByLabelText("Kapak başlığı")).toHaveAttribute("maxlength", "30");
  });
  it("filtre stilinde başlık alanı görünmez", async () => {
    await renderAt("/k/retro-70/stil");
    expect(screen.queryByLabelText("Kapak başlığı")).toBeNull();
  });
  it("kategori yalnızca kendi stillerini gösterir", async () => {
    await renderAt("/k/retro-70/stil");
    expect(screen.getByRole("button", { name: "Anlık Film" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Plak Kapağı" })).toBeNull();
  });
  it("önizleme kalitesinde işler ve sonucu gösterir", async () => {
    const engine = fakeEngine();
    await renderAt("/k/retro-70/stil", { engine });
    expect(engine.render).toHaveBeenLastCalledWith(
      fakePhoto,
      expect.objectContaining({ quality: "preview", format: "post", year: 1977, yearRange: expect.objectContaining({ min: 1970, max: 1979 }) }),
    );
    expect(screen.getByRole("img", { name: "Önizleme" })).toHaveAttribute("src", "blob:image/one");
  });
  it("film seçeneği açılıp kapanır ve yeniden işler", async () => {
    const engine = fakeEngine();
    await renderAt("/k/retro-70/stil", { engine });
    const chip = screen.getByRole("button", { name: "Işık sızıntısı" });
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(engine.render).toHaveBeenLastCalledWith(fakePhoto, expect.objectContaining({ options: new Set(["leak"]) }));
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(engine.render).toHaveBeenLastCalledWith(fakePhoto, expect.objectContaining({ options: new Set() }));
  });
  it("yıl değişince yeniden işler", async () => {
    const engine = fakeEngine();
    await renderAt("/k/retro-70/stil", { engine });
    const slider = screen.getByRole("slider", { name: /Yıl/ });
    await act(async () => fireEvent.change(slider, { target: { value: "1972" } }));
    expect(engine.render).toHaveBeenLastCalledWith(fakePhoto, expect.objectContaining({ year: 1972 }));
  });
  it("hızlı seçimlerde yalnızca son istek ekrana yansır", async () => {
    const finish: ((type: string) => void)[] = [];
    const engine = fakeEngine();
    engine.render.mockImplementation(
      () => new Promise<RenderResult>((resolve) => finish.push((type) => resolve({ blob: new Blob([], { type }), width: 1, height: 1 }))),
    );
    await renderAt("/k/retro-70/stil", { engine });
    await user.click(screen.getByRole("button", { name: "Sıcak Slayt Filmi" }));
    await user.click(screen.getByRole("button", { name: "Super 8 Karesi" }));
    expect(engine.render).toHaveBeenCalledTimes(1);

    await act(async () => finish[0]("image/stale"));
    expect(screen.queryByRole("img", { name: "Önizleme" })).toBeNull();
    expect(engine.render).toHaveBeenCalledTimes(2);
    expect(engine.render).toHaveBeenLastCalledWith(fakePhoto, expect.objectContaining({ style: expect.objectContaining({ id: "super8" }) }));

    await act(async () => finish[1]("image/last"));
    expect(screen.getByRole("img", { name: "Önizleme" })).toHaveAttribute("src", "blob:image/last");
  });
  it("yeni önizleme gelince eskisinin adresini bırakır", async () => {
    const engine = fakeEngine();
    await renderAt("/k/retro-70/stil", { engine });
    engine.render.mockResolvedValueOnce({ blob: new Blob([], { type: "image/two" }), width: 1, height: 1 });
    await user.click(screen.getByRole("button", { name: "Sıcak Slayt Filmi" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:image/one");
  });
  it("WebGL yoksa açıklama gösterir", async () => {
    const engine = fakeEngine();
    engine.render.mockRejectedValue(new Error("webgl_unavailable"));
    await renderAt("/k/retro-70/stil", { engine });
    expect(screen.getByRole("alert")).toHaveTextContent("Bu cihaz görsel işlemeyi desteklemiyor.");
  });
  it("düğme konsept metniyle sonuca götürür", async () => {
    await renderAt("/k/retro-70/stil");
    await user.click(screen.getByRole("button", { name: "70'lere gönder" }));
    expect(window.location.pathname).toBe("/k/retro-70/sonuc");
  });
  it("uygulama stil yolunu gerçek ekrana bağlar", async () => {
    window.history.pushState({}, "", "/k/retro-70/stil");
    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
      );
    });
    expect(window.location.pathname).toBe("/k/retro-70/foto");
  });
});
