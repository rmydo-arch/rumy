import { useEffect, useRef, useState } from "react";
import type { FormatId } from "../../concepts/types";
import { coverCrop, outputSize } from "../../engine/geometry";
import { MAX_PREVIEW_EDGE } from "../../engine/limits";

interface Props {
  bitmap: ImageBitmap;
  photoWidth: number;
  photoHeight: number;
  format: FormatId;
  afterUrl: string;
  afterLabel: string;
}

export function CompareSlider({ bitmap, photoWidth, photoHeight, format, afterUrl, afterLabel }: Props) {
  const [split, setSplit] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = outputSize(format, MAX_PREVIEW_EDGE);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    const crop = coverCrop(photoWidth, photoHeight, width, height);
    ctx.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
  }, [bitmap, photoWidth, photoHeight, width, height]);

  return (
    <div className="compare" style={{ aspectRatio: `${width} / ${height}` }}>
      <img className="compare__layer" src={afterUrl} alt="Sonuç" />
      <canvas ref={canvasRef} className="compare__layer" aria-hidden="true" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
      <div className="compare__line" aria-hidden="true" style={{ left: `${split}%` }} />
      <div className="compare__handle" aria-hidden="true" style={{ left: `${split}%` }}>
        &lt; &gt;
      </div>
      <span className="compare__tag compare__tag--before">Önce</span>
      <span className="compare__tag compare__tag--after">{afterLabel}</span>
      <input
        className="compare__range"
        type="range"
        min={0}
        max={100}
        value={split}
        aria-label="Önce ve sonra karşılaştırması"
        onChange={(e) => setSplit(Number(e.target.value))}
      />
    </div>
  );
}
