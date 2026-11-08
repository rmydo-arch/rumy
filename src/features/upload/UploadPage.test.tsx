import { render, screen } from "@testing-library/react";
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
});
