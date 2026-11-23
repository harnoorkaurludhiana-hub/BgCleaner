"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { ErrorMessage } from "@/components/common/ErrorMessage";
import { ACCEPT_ATTR, ACCEPTED_TYPES, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { useEditorStore } from "@/stores/editorStore";
import type { Background } from "@/types/editor";

const COLORS = ["#ffffff", "#0b0b0b", "#f1efe8", "#d9d2c3", "#a8a397", "#5b6670", "#2f3a33", "#6e2424"];
const GRADIENTS: Extract<Background, { type: "gradient" }>[] = [
  { type: "gradient", from: "#0b0b0b", to: "#4a4a4a", angle: 90 },
  { type: "gradient", from: "#f4f1ea", to: "#d6ccb9", angle: 90 },
  { type: "gradient", from: "#e9ecee", to: "#9aa5ad", angle: 135 },
  { type: "gradient", from: "#3a2f2a", to: "#a68a6d", angle: 45 },
];

const swatch = (active: boolean) =>
  `size-9 rounded-lg border transition ${active ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-rule-strong hover:scale-105"}`;

export function BackgroundSelector() {
  const background = useEditorStore((s) => s.edit.background);
  const { set, apply, commit, addAsset } = useEditorStore.getState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const same = (b: Background) => JSON.stringify(b) === JSON.stringify(background);

  async function onBackgroundFile(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) return setError("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return setError(`Background image must be under ${MAX_FILE_SIZE_MB} MB.`);
    try {
      // Decoded locally only; custom backgrounds never leave the browser.
      const bitmap = await createImageBitmap(file);
      apply({ background: { type: "image", assetId: addAsset(bitmap) } });
    } catch {
      setError("This image couldn't be read.");
    }
  }

  return (
    <section>
      <h3 className="label mb-3">Background</h3>

      <div className="flex flex-wrap gap-2">
        <button aria-label="Transparent" title="Transparent" onClick={() => apply({ background: { type: "transparent" } })} className={`checkerboard ${swatch(background.type === "transparent")}`} />
        {COLORS.map((color) => (
          <button
            key={color}
            aria-label={`Color ${color}`}
            title={color}
            onClick={() => apply({ background: { type: "color", color } })}
            className={swatch(same({ type: "color", color }))}
            style={{ background: color }}
          />
        ))}
        <label title="Custom color" className={`relative cursor-pointer overflow-hidden ${swatch(background.type === "color" && !COLORS.includes(background.color))}`} style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
          <input
            type="color"
            aria-label="Custom color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={background.type === "color" ? background.color : "#ffffff"}
            onChange={(e) => set({ background: { type: "color", color: e.target.value } })}
            onBlur={commit}
          />
        </label>
      </div>

      <p className="label mb-2 mt-5">Gradient</p>
      <div className="flex flex-wrap gap-2">
        {GRADIENTS.map((g) => (
          <button
            key={g.from + g.to}
            aria-label={`Gradient ${g.from} to ${g.to}`}
            onClick={() => apply({ background: g })}
            className={swatch(same(g))}
            style={{ background: `linear-gradient(${g.angle + 90}deg, ${g.from}, ${g.to})` }}
          />
        ))}
      </div>
      {background.type === "gradient" && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          {(["from", "to"] as const).map((key) => (
            <input
              key={key}
              type="color"
              aria-label={`Gradient ${key} color`}
              value={background[key]}
              onChange={(e) => set({ background: { ...background, [key]: e.target.value } })}
              onBlur={commit}
              className="h-9 w-12 cursor-pointer rounded-lg border border-rule bg-raised p-1"
            />
          ))}
          <input
            type="range"
            min={0}
            max={360}
            aria-label="Gradient angle"
            value={background.angle}
            onChange={(e) => set({ background: { ...background, angle: Number(e.target.value) } })}
            onPointerUp={commit}
            onKeyUp={commit}
            className="flex-1"
          />
        </div>
      )}

      <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => onBackgroundFile(e.target.files?.[0])} />
      <button
        onClick={() => fileRef.current?.click()}
        className={`mt-5 w-full ${background.type === "image" ? "btn-primary" : "btn-ghost"}`}
      >
        <ImagePlus className="size-3.5" /> {background.type === "image" ? "Change background image" : "Upload background image"}
      </button>
      {error && <ErrorMessage message={error} />}
    </section>
  );
}
