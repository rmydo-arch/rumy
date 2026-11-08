import type { FilmOptionId } from "../../concepts/types";

const OPTIONS: { id: FilmOptionId; label: string }[] = [
  { id: "grain", label: "Belirgin gren" },
  { id: "leak", label: "Işık sızıntısı" },
  { id: "fade", label: "Soluk siyahlar" },
  { id: "orangeShift", label: "Turuncu renk kayması" },
  { id: "vignette", label: "Köşe kararması" },
  { id: "dateStamp", label: "Tarih damgası" },
];

interface Props {
  selected: ReadonlySet<FilmOptionId>;
  onChange(next: ReadonlySet<FilmOptionId>): void;
}

export function FilmOptions({ selected, onChange }: Props) {
  function toggle(id: FilmOptionId) {
    const next = new Set(selected);
    if (!next.delete(id)) next.add(id);
    onChange(next);
  }

  return (
    <section className="editor__group">
      <h2 className="editor__subtitle">Detay ekle</h2>
      <div className="editor__chips">
        {OPTIONS.map(({ id, label }) => (
          <button key={id} type="button" className="editor__chip" aria-pressed={selected.has(id)} onClick={() => toggle(id)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
