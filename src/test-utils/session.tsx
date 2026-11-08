import { act, render } from "@testing-library/react";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { SessionProvider, useSession } from "../app/session";
import type { Selection } from "../concepts/types";
import { EngineProvider } from "../engine/EngineContext";
import type { EngineCapability, ImageEngine, PreparedPhoto, RenderResult } from "../engine/types";

export const fakePhoto = { bitmap: { close: vi.fn() }, width: 100, height: 200 } as unknown as PreparedPhoto;

export function fakeEngine(capabilities: EngineCapability[] = ["grade"]) {
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

export interface Setup {
  photo?: PreparedPhoto | null;
  engine?: ImageEngine;
  selection?: Partial<Selection>;
}

/** Mounts one page at its route with a seeded session and a fake engine; other routes render nothing. */
export async function renderPage(url: string, routePath: string, page: ReactElement, { photo = fakePhoto, engine = fakeEngine(), selection }: Setup = {}) {
  window.history.pushState({}, "", url);
  await act(async () => {
    render(
      <BrowserRouter>
        <SessionProvider>
          <EngineProvider engine={engine}>
            <Seed photo={photo} selection={selection}>
              <Routes>
                <Route path={routePath} element={page} />
                <Route path="*" element={null} />
              </Routes>
            </Seed>
          </EngineProvider>
        </SessionProvider>
      </BrowserRouter>,
    );
  });
}

export function stubObjectUrls() {
  URL.createObjectURL = vi.fn((b: Blob) => `blob:${b.type}`) as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
}
