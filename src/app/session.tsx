import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { catalog } from "../concepts/catalog";
import type { LiveConcept, Selection } from "../concepts/types";
import type { PreparedPhoto } from "../engine/types";

interface Session {
  photo: PreparedPhoto | null;
  setPhoto(p: PreparedPhoto | null): void;
  selection: Selection;
  updateSelection(patch: Partial<Selection>): void;
  resetSelection(concept: LiveConcept): void;
}

function selectionFor(concept: LiveConcept): Selection {
  return {
    conceptId: concept.id,
    styleId: concept.styles[0].id,
    variant: "ozgun",
    options: new Set(),
    year: concept.yearRange?.default ?? null,
    format: "post",
    title: "",
  };
}

const firstLive = catalog.flatMap((s) => s.concepts).find((c): c is LiveConcept => c.status === "live");
if (!firstLive) throw new Error("catalog has no live concept");

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [photo, setPhotoState] = useState<PreparedPhoto | null>(null);
  const [selection, setSelection] = useState<Selection>(() => selectionFor(firstLive!));
  const photoRef = useRef<PreparedPhoto | null>(null);

  const setPhoto = useCallback((p: PreparedPhoto | null) => {
    photoRef.current?.bitmap.close();
    photoRef.current = p;
    setPhotoState(p);
  }, []);
  const updateSelection = useCallback((patch: Partial<Selection>) => setSelection((s) => ({ ...s, ...patch })), []);
  const resetSelection = useCallback((concept: LiveConcept) => setSelection(selectionFor(concept)), []);

  const value = useMemo(
    () => ({ photo, setPhoto, selection, updateSelection, resetSelection }),
    [photo, setPhoto, selection, updateSelection, resetSelection],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
