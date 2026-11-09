import { useNavigate } from "react-router-dom";
import { paths } from "../../app/routes";
import { catalog } from "../../concepts/catalog";
import type { LiveConcept } from "../../concepts/types";
import { ConceptCard } from "./ConceptCard";
import "./gallery.css";

export function GalleryPage() {
  const navigate = useNavigate();
  const open = (id: string) => navigate(paths.photo(id));
  const feature = catalog
    .flatMap((shelf) => shelf.concepts)
    .find((c): c is LiveConcept => c.status === "live");

  return (
    <main className="gallery">
      <div>
        <h1 className="gallery__title">Bugün kim olmak istersin?</h1>
        <p className="gallery__subtitle">Bir konsept seç, fotoğrafını yükle, gerisini bir cümleyle anlat.</p>
      </div>

      {feature && (
        <button type="button" className="feature" onClick={() => open(feature.id)}>
          <span className="feature__art" aria-hidden="true" style={{ background: feature.cardArt }} />
          <span className="feature__body">
            <span className="feature__badge">Şimdi açık</span>
            <span className="feature__title">{feature.title}</span>
            <span className="feature__pitch">{feature.pitch}</span>
            <span className="feature__cta">Fotoğrafını seç</span>
          </span>
        </button>
      )}

      {catalog.map((shelf) => (
        <section key={shelf.id} className="shelf" aria-labelledby={`shelf-${shelf.id}`}>
          <div>
            <h2 id={`shelf-${shelf.id}`} className="shelf__title">{shelf.title}</h2>
            <p className="shelf__description">{shelf.description}</p>
          </div>
          <div className="shelf__grid">
            {shelf.concepts.map((concept) => (
              <ConceptCard key={concept.id} concept={concept} onOpen={open} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
