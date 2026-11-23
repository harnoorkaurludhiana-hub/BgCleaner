"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, Paintbrush, RotateCcw, Upload, ZoomIn, ZoomOut } from "lucide-react";

import { ErrorMessage } from "@/components/common/ErrorMessage";
import { BeforeAfterSlider } from "@/components/preview/BeforeAfterSlider";
import { fetchImageBlob, mediaUrl } from "@/services/imageService";
import { useEditorStore } from "@/stores/editorStore";
import type { ProcessedImage } from "@/types/image";
import { baseName, downloadBlob } from "@/lib/utils";

interface Props {
  result: ProcessedImage;
  fileName: string;
  onReset: () => void;
}

type View = "compare" | "side";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const VIEW_HEIGHT_REM = 28;

export function ImagePreview({ result, fileName, onReset }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("compare");
  const [zoom, setZoom] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const original = mediaUrl(result.original_url);
  const processed = mediaUrl(result.processed_url);
  const aspect = result.width / result.height;
  // At zoom 1 the image fits the viewport height; higher zoom overflows and scrolls.
  const sizeStyle = { width: `min(${zoom * 100}%, ${zoom * VIEW_HEIGHT_REM * aspect}rem)` };

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      // Download the server PNG as-is so the alpha channel is untouched.
      const blob = await fetchImageBlob(result.processed_url);
      downloadBlob(blob, `${baseName(fileName)}-no-bg.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  function openEditor() {
    useEditorStore.getState().setSource(result, fileName);
    router.push(`/editor?id=${result.image_id}`);
  }

  function resetPreview() {
    setZoom(1);
    setResetKey((k) => k + 1);
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule p-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <CheckCircle2 className="size-4 text-emerald-400" /> Background removed
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-rule bg-raised p-0.5" role="tablist">
            {(["compare", "side"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`chip whitespace-nowrap border-transparent ${view === v ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
              >
                {v === "compare" ? "Compare" : "Side by side"}
              </button>
            ))}
          </div>
          <button aria-label="Zoom out" className="icon-btn" disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}>
            <ZoomOut className="size-4" strokeWidth={1.5} />
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
          <button aria-label="Zoom in" className="icon-btn" disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}>
            <ZoomIn className="size-4" strokeWidth={1.5} />
          </button>
          <button aria-label="Reset preview" className="icon-btn" onClick={resetPreview}>
            <RotateCcw className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {view === "compare" ? (
        <div className="overflow-auto bg-raised" style={{ maxHeight: `${VIEW_HEIGHT_REM}rem` }}>
          <div className="mx-auto" style={sizeStyle}>
            <BeforeAfterSlider key={resetKey} before={original} after={processed} alt="Your image" />
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2">
          {[
            { label: "Original", src: original, bg: "bg-raised" },
            { label: "Background removed", src: processed, bg: "checkerboard" },
          ].map(({ label, src, bg }, i) => (
            <figure key={label} className={i ? "border-t border-rule sm:border-l sm:border-t-0" : ""}>
              <figcaption className="label px-3 py-2">{label}</figcaption>
              <div className={`overflow-auto ${bg}`} style={{ maxHeight: `${VIEW_HEIGHT_REM}rem` }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic backend image */}
                <img src={src} alt={label} className="mx-auto block" style={sizeStyle} />
              </div>
            </figure>
          ))}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-rule p-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={onReset} className="btn border-transparent px-2 text-muted hover:text-ink">
          <Upload className="size-3.5" /> New image
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="label text-center sm:mr-2">
            {result.width} × {result.height} px
          </span>
          <button onClick={openEditor} className="btn-ghost">
            <Paintbrush className="size-3.5" /> Edit &amp; background
          </button>
          <button onClick={download} disabled={downloading} className="btn-primary">
            {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {downloading ? "Preparing…" : "Download PNG"}
          </button>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
