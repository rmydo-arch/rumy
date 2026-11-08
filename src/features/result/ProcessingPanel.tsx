import { useEffect, useState } from "react";

const STAGE_MS = 450;

interface Props {
  title: string;
  stages: string[];
  onCancel(): void;
}

export function ProcessingPanel({ title, stages, onCancel }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), STAGE_MS);
    return () => clearInterval(timer);
  }, [stages.length]);

  return (
    <div className="processing">
      <h1 className="processing__title">{title}</h1>
      <p className="processing__now" aria-live="polite">
        {stages[stage]}
      </p>
      <div
        className="processing__bar"
        role="progressbar"
        aria-label="Düzenleme ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={stages.length}
        aria-valuenow={stage + 1}
      >
        <div className="processing__fill" style={{ width: `${((stage + 1) / stages.length) * 100}%` }} />
      </div>
      <button type="button" className="processing__cancel" onClick={onCancel}>
        Vazgeç
      </button>
    </div>
  );
}
