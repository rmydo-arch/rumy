import type { CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../app/routes";
import { useSession } from "../../app/session";
import { getLiveConcept } from "../../concepts/catalog";
import type { LiveConcept, VariantId } from "../../concepts/types";
import { useEngine } from "../../engine/EngineContext";
import type { PreparedPhoto } from "../../engine/types";
import { useSelectionRender, type RenderFailure } from "../../engine/useSelectionRender";
import { resultFilename, shareOrDownload } from "../../services/share";
import { CompareSlider } from "./CompareSlider";
import { ProcessingPanel } from "./ProcessingPanel";
import "../editor/editor.css";
import "./result.css";

const VARIANTS: { id: VariantId; label: string }[] = [
  { id: "ozgun", label: "Özgün" },
  { id: "solgun", label: "Solgun" },
  { id: "canli", label: "Canlı" },
];
const ERROR_TEXT: Record<RenderFailure, string> = {
  unsupported: "Bu cihaz görsel işlemeyi desteklemiyor.",
  failed: "Görüntü hazırlanamadı. Stile dönüp tekrar dene.",
};

export function ResultPage() {
  const { id = "" } = useParams();
  const concept = getLiveConcept(id);
  const { photo } = useSession();
  if (!concept) return <Navigate to={paths.gallery} replace />;
  if (!photo) return <Navigate to={paths.photo(concept.id)} replace />;
  return <Result concept={concept} photo={photo} />;
}

function Result({ concept, photo }: { concept: LiveConcept; photo: PreparedPhoto }) {
  const navigate = useNavigate();
  const engine = useEngine();
  const { selection, updateSelection } = useSession();
  const { style, output, error, pending } = useSelectionRender(engine, photo, concept, selection, "export");
  const backToStyle = () => navigate(paths.editor(concept.id));

  if (!output && !error) {
    return (
      <main className="page result-status">
        <ProcessingPanel title={concept.copy.processingTitle} stages={concept.copy.processingStages} onCancel={backToStyle} />
      </main>
    );
  }

  function deliver(mode: "share" | "download") {
    if (output && !pending) void shareOrDownload(output.blob, resultFilename(style.id, selection.format), mode);
  }

  const pageVars = { "--concept-accent": concept.theme.accent, "--concept-stage": concept.theme.stage } as CSSProperties;

  return (
    <main className="editor" style={pageVars}>
      <section className="editor__stage">
        {output && (
          <CompareSlider
            bitmap={photo.bitmap}
            photoWidth={photo.width}
            photoHeight={photo.height}
            format={output.request.format}
            afterUrl={output.url}
            afterLabel={concept.name}
          />
        )}
        {error && (
          <p role="alert" className="editor__error">
            {ERROR_TEXT[error]}
          </p>
        )}
      </section>

      <section className="editor__panel">
        <div>
          <p className="editor__concept">{concept.name}</p>
          <h1 className="result__title">{concept.copy.resultTitle(selection.year)}</h1>
          <p className="result__style">{style.name}</p>
        </div>

        <section>
          <h2 className="editor__subtitle">Varyasyonlar</h2>
          <div className="result__variants">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                className="editor__chip"
                aria-pressed={v.id === selection.variant}
                onClick={() => updateSelection({ variant: v.id })}
              >
                {v.label}
              </button>
            ))}
          </div>
        </section>

        <div className="result__actions">
          <button type="button" className="result__primary" disabled={pending} onClick={() => deliver("download")}>
            İndir
          </button>
          <button type="button" className="result__secondary" disabled={pending} onClick={() => deliver("share")}>
            Paylaş
          </button>
        </div>

        <div className="result__links">
          <button type="button" className="result__link" onClick={backToStyle}>
            Stile dön
          </button>
          <button type="button" className="result__link" onClick={() => navigate(paths.photo(concept.id))}>
            Yeni fotoğraf
          </button>
          <button type="button" className="result__link" onClick={() => navigate(paths.gallery)}>
            Başka konsept
          </button>
        </div>
      </section>
    </main>
  );
}
