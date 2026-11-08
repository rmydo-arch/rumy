import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { App } from "../../app/App";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

describe("GalleryPage", () => {
  it("canlı kart fotoğraf ekranına götürür", async () => {
    const user = userEvent.setup();
    renderAt("/");
    const retro = within(screen.getByRole("region", { name: "Retro" }));
    await user.click(retro.getByRole("button", { name: /70'ler/ }));
    expect(window.location.pathname).toBe("/k/retro-70/foto");
  });

  it("afiş aynı fotoğraf ekranına götürür", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByRole("button", { name: /Fotoğrafını seç/ }));
    expect(window.location.pathname).toBe("/k/retro-70/foto");
  });

  it("Yakında kartları tıklanamaz", () => {
    renderAt("/");
    expect(screen.queryByRole("button", { name: /Çizgi Kahraman/ })).toBeNull();
    expect(screen.getAllByText("Yakında")).toHaveLength(17);
  });
});
