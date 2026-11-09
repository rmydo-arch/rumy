import type { Concept } from "../../concepts/types";

interface Props {
  concept: Concept;
  onOpen: (id: string) => void;
}

export function ConceptCard({ concept, onOpen }: Props) {
  const body = (
    <>
      <span className="concept-card__art" aria-hidden="true" style={{ background: concept.cardArt }} />
      <span className="concept-card__body">
        <span className="concept-card__name">{concept.name}</span>
        <span className="concept-card__sub">{concept.sub}</span>
        <span className="concept-card__badge">{concept.status === "live" ? "Canlı" : "Yakında"}</span>
      </span>
    </>
  );
  if (concept.status === "live") {
    return (
      <button type="button" className="concept-card concept-card--live" onClick={() => onOpen(concept.id)}>
        {body}
      </button>
    );
  }
  return <div className="concept-card concept-card--soon">{body}</div>;
}
