import { useEffect, useRef, useState } from "react";
import type { ImageEngine, PreparedPhoto, RenderRequest } from "../../engine/types";

export type PreviewError = "unsupported" | "failed";

/**
 * Renders one request at a time. Requests made meanwhile collapse into the newest,
 * so a burst of changes neither shows stale output nor builds a backlog on slow phones.
 */
export function usePreview(engine: ImageEngine, photo: PreparedPhoto, request: RenderRequest) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<PreviewError | null>(null);
  const job = useRef({ wanted: null as RenderRequest | null, running: false, alive: true });

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
            setUrl(URL.createObjectURL(blob));
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

  return { url, error };
}
