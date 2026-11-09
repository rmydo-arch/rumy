import type { Style } from "../../concepts/types";

interface Props {
  styles: Style[];
  selectedId: string;
  onPick(style: Style): void;
}

export function StyleGrid({ styles, selectedId, onPick }: Props) {
  return (
    <div className="editor__styles">
      {styles.map((style) => (
        <button
          key={style.id}
          type="button"
          className="editor__style"
          aria-pressed={style.id === selectedId}
          onClick={() => onPick(style)}
        >
          <span className="editor__style-art" aria-hidden="true" style={{ background: style.thumbnail }} />
          <span className="editor__style-name">{style.name}</span>
        </button>
      ))}
    </div>
  );
}
