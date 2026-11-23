"use client";

import { Maximize, Crosshair, RotateCcw, RotateCw } from "lucide-react";

import { maxOutputWidth, outputSize } from "@/lib/renderEditor";
import { useEditorStore } from "@/stores/editorStore";

const RATIOS: { label: string; ratio: number | null }[] = [
  { label: "Original", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:5", ratio: 4 / 5 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "9:16", ratio: 9 / 16 },
];

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function Range({ label, value, min, max, step, display, onChange }: RangeProps) {
  const commit = useEditorStore((s) => s.commit);
  return (
    <label className="block text-sm">
      <span className="flex justify-between">
        <span className="text-sm font-medium text-ink">{label}</span> <span className="text-xs tabular-nums text-muted">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        className="mt-2 w-full"
      />
    </label>
  );
}

const pill = (active: boolean) => `chip ${active ? "chip-on" : "chip-off"}`;
const action = "btn-ghost flex-1 px-2 py-2";

export function ImageControls() {
  const edit = useEditorStore((s) => s.edit);
  const cutout = useEditorStore((s) => s.cutout);
  const { set, apply, commit } = useEditorStore.getState();
  if (!cutout) return null;

  const W = cutout.width;
  const H = cutout.height;
  const canvasRatio = edit.canvasWidth / edit.canvasHeight;

  // Crop = choose a canvas aspect ratio that cuts into the cutout, keeping it centered.
  function crop(ratio: number | null) {
    const r = ratio ?? W / H;
    const [cw, ch] = r > W / H ? [W, Math.round(W / r)] : [Math.round(H * r), H];
    const next = { ...edit, canvasWidth: cw, canvasHeight: ch, x: cw / 2, y: ch / 2, scale: 1, rotation: 0 };
    apply({ ...next, outputWidth: Math.min(cw, maxOutputWidth(next)) });
  }

  function fit() {
    const rad = (edit.rotation * Math.PI) / 180;
    const bw = Math.abs(W * Math.cos(rad)) + Math.abs(H * Math.sin(rad));
    const bh = Math.abs(W * Math.sin(rad)) + Math.abs(H * Math.cos(rad));
    apply({ scale: Math.min(edit.canvasWidth / bw, edit.canvasHeight / bh), x: edit.canvasWidth / 2, y: edit.canvasHeight / 2 });
  }

  const rotateBy = (deg: number) => apply({ rotation: ((((edit.rotation + deg + 180) % 360) + 360) % 360) - 180 });
  const { width: outW, height: outH } = outputSize(edit);
  const maxW = maxOutputWidth(edit);

  return (
    <section className="space-y-5">
      <div>
        <h3 className="label mb-3">Crop</h3>
        <div className="flex flex-wrap gap-1.5">
          {RATIOS.map(({ label, ratio }) => (
            <button key={label} onClick={() => crop(ratio)} className={pill(Math.abs(canvasRatio - (ratio ?? W / H)) < 0.01)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="label">Subject</h3>
        <Range label="Zoom" min={0.1} max={3} step={0.01} value={edit.scale} display={`${Math.round(edit.scale * 100)}%`} onChange={(scale) => set({ scale })} />
        <Range label="Rotate" min={-180} max={180} step={1} value={edit.rotation} display={`${edit.rotation}°`} onChange={(rotation) => set({ rotation })} />
        <div className="flex gap-2">
          <button className={action} onClick={() => rotateBy(-90)} aria-label="Rotate left 90°"><RotateCcw className="size-3.5" /> 90°</button>
          <button className={action} onClick={() => rotateBy(90)} aria-label="Rotate right 90°"><RotateCw className="size-3.5" /> 90°</button>
        </div>
        <div className="flex gap-2">
          <button className={action} onClick={fit}><Maximize className="size-3.5" /> Fit</button>
          <button className={action} onClick={() => apply({ x: edit.canvasWidth / 2, y: edit.canvasHeight / 2 })}><Crosshair className="size-3.5" /> Center</button>
        </div>
        <p className="text-xs text-muted">Drag the image on the canvas to move it.</p>
      </div>

      <div>
        <h3 className="label mb-3">Output size</h3>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="number"
            aria-label="Output width"
            min={16}
            max={maxW}
            value={outW}
            onChange={(e) => set({ outputWidth: Math.max(1, Math.min(maxW, Math.round(Number(e.target.value)) || 1)) })}
            onBlur={() => {
              if (edit.outputWidth < 16) set({ outputWidth: 16 });
              commit();
            }}
            className="field w-24"
          />
          <span className="text-muted">×</span>
          <span className="tabular-nums text-ink">{outH}</span>
          <span className="label">px</span>
        </div>
        <p className="mt-2 text-xs text-muted">Aspect ratio is locked to the canvas. Max width {maxW}px.</p>
      </div>
    </section>
  );
}
