import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveConcept, Selection } from "../concepts/types";
import type { ImageEngine, PreparedPhoto, RenderRequest } from "./types";

export type RenderFailure = "unsupported" | "failed";

interface Output { url: string; blob: Blob; request: RenderRequest; }

/**
 * Renders the current selection one request at a time. Requests made meanwhile collapse
 * into the newest, so a burst of changes neither shows stale output nor builds a backlog
 * on slow phones. `pending` is true until the output matches the current selection.
 */
export function useSelectionRender(
  engine: ImageEngine,
  photo: PreparedPhoto,
  concept: LiveConcept,
  selection: Selection,
  quality: RenderRequest["quality"],
) {
  const style = concept.styles.find((s) => s.id === selection.styleId) ?? concept.styles[0];
  const { variant, options, year, format, title } = selection;
  const { yearRange } = concept;
  const request = useMemo<RenderRequest>(
    () => ({ style, variant, options, year, yearRange, format, title, quality }),
    [style, variant, options, year, yearRange, format, title, quality],
  );

  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<RenderFailure | null>(null);
  const job = useRef({ wanted: null as RenderRequest | null, running: false, alive: true });

  const url = output?.url;
  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);

  useEffect(() => {
    const j = job.current;
    j.alive = true;
    j.wanted = request;
    if (j.running) return;
    j.running = true;
    void (async () => {
      while (j.wanted && j.alive) {
        const current = j.wanted;
        j.wanted = null;
        try {
          const { blob } = await engine.render(photo, current);
          if (j.alive && !j.wanted) {
            setOutput({ url: URL.createObjectURL(blob), blob, request: current });
            setError(null);
          }
        } catch (e) {
          if (j.alive && !j.wanted) {
            setError(e instanceof Error && e.message === "webgl_unavailable" ? "unsupported" : "failed");
          }
        }
      }
      j.running = false;
    })();
  }, [engine, photo, request]);

  useEffect(() => {
    const j = job.current;
    return () => {
      j.alive = false;
    };
  }, []);

  return { style, output, error, pending: output?.request !== request };
}
