import { useId, useMemo, useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { paths } from "../../app/routes";
import { useSession } from "../../app/session";
import { getLiveConcept } from "../../concepts/catalog";
import type { FormatId, LiveConcept, Style } from "../../concepts/types";
import { useEngine } from "../../engine/EngineContext";
import type { PreparedPhoto, RenderRequest } from "../../engine/types";
import { FilmOptions } from "./FilmOptions";
import { FormatPicker } from "./FormatPicker";
import { StyleGrid } from "./StyleGrid";
import { usePreview, type PreviewError } from "./usePreview";
import "./editor.css";

const RATIO: Record<FormatId, string> = { post: "4 / 5", kare: "1 / 1", story: "9 / 16" };
const ERROR_TEXT: Record<PreviewError, string> = {
  unsupported: "Bu cihaz görsel işlemeyi desteklemiyor.",
  failed: "Önizleme hazırlanamadı. Başka bir stil dene.",
};

export function EditorPage() {
  const { id = "" } = useParams();
  const concept = getLiveConcept(id);
  const { photo } = useSession();
  if (!concept) return <Navigate to={paths.gallery} replace />;
  if (!photo) return <Navigate to={paths.photo(concept.id)} replace />;
  return <Editor concept={concept} photo={photo} />;
}

function Editor({ concept, photo }: { concept: LiveConcept; photo: PreparedPhoto }) {
  const navigate = useNavigate();
  const engine = useEngine();
  const { selection, updateSelection } = useSession();
  const promptId = useId();
  const style = concept.styles.find((s) => s.id === selection.styleId) ?? concept.styles[0];
  const [categoryId, setCategoryId] = useState(style.categoryId);
  const { variant, options, year, format, title } = selection;
  const { yearRange } = concept;

  const request = useMemo<RenderRequest>(
    () => ({ style, variant, options, year, yearRange, format, title, quality: "preview" }),
    [style, variant, options, year, yearRange, format, title],
  );
  const preview = usePreview(engine, photo, request);

  function pickStyle(next: Style) {
    const locked = next.template?.lockedFormat;
    updateSelection({ styleId: next.id, ...(locked ? { format: locked } : {}) });
  }

  const pageVars = { "--concept-accent": concept.theme.accent, "--concept-stage": concept.theme.stage } as CSSProperties;

  return (
    <main className="editor" style={pageVars}>
      <section className="editor__stage">
        <div className="editor__preview" style={{ aspectRatio: RATIO[format] }}>
          {preview.url && <img className="editor__image" src={preview.url} alt="Önizleme" />}
        </div>
        <div className="editor__stage-controls">
          <FormatPicker value={format} locked={style.template?.lockedFormat} onChange={(f) => updateSelection({ format: f })} />
          <button type="button" className="editor__change" onClick={() => navigate(paths.photo(concept.id))}>
            Fotoğrafı değiştir
          </button>
        </div>
        {preview.error && (
          <p role="alert" className="editor__error">
            {ERROR_TEXT[preview.error]}
          </p>
        )}
      </section>

      <section className="editor__panel">
        <div>
          <p className="editor__concept">{concept.name}</p>
          <h1 className="editor__title">{concept.copy.editTitle}</h1>
        </div>

        <div className="editor__chips">
          {concept.categories.map((c) => (
            <button key={c.id} type="button" className="editor__chip" aria-pressed={c.id === categoryId} onClick={() => setCategoryId(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <StyleGrid styles={concept.styles.filter((s) => s.categoryId === categoryId)} selectedId={style.id} onPick={pickStyle} />

        {style.kind === "template" && (
          <label className="editor__field">
            Kapak başlığı
            <input
              className="editor__input"
              type="text"
              maxLength={30}
              placeholder="En fazla 30 karakter"
              value={title}
              onChange={(e) => updateSelection({ title: e.target.value })}
            />
          </label>
        )}

        {engine.capabilities.has("prompt") && (
          <div className="editor__field">
            <label htmlFor={promptId}>Prompt</label>
            <textarea id={promptId} key={style.id} className="editor__input" rows={3} defaultValue={style.promptSeed} />
          </div>
        )}

        <FilmOptions selected={options} onChange={(next) => updateSelection({ options: next })} />

        {yearRange && year !== null && (
          <label className="editor__field">
            <span className="editor__year">
              <span>Yıl</span>
              <span>{year}</span>
            </span>
            <input
              className="editor__range"
              type="range"
              min={yearRange.min}
              max={yearRange.max}
              step={1}
              value={year}
              onChange={(e) => updateSelection({ year: Number(e.target.value) })}
            />
          </label>
        )}

        <button type="button" className="editor__cta" onClick={() => navigate(paths.result(concept.id))}>
          {concept.copy.cta}
        </button>
      </section>
    </main>
  );
}
