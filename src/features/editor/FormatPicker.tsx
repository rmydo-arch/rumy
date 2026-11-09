import type { FormatId } from "../../concepts/types";

const FORMATS: { id: FormatId; label: string }[] = [
  { id: "post", label: "Gönderi 4:5" },
  { id: "kare", label: "Kare 1:1" },
  { id: "story", label: "Hikâye 9:16" },
];

interface Props {
  value: FormatId;
  locked?: FormatId;
  onChange(format: FormatId): void;
}

export function FormatPicker({ value, locked, onChange }: Props) {
  return (
    <>
      {FORMATS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className="editor__format"
          aria-pressed={id === value}
          disabled={locked !== undefined && id !== locked}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </>
  );
}
