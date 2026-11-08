import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

describe("App", () => {
  it("galeri yolunda marka başlığını gösterir", () => {
    renderAt("/");
    expect(screen.getByRole("button", { name: "kılık" })).toBeInTheDocument();
  });

  it("bilinmeyen yolda galeriye döner", () => {
    renderAt("/yok");
    expect(window.location.pathname).toBe("/");
  });
});
