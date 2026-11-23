"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";

import { ErrorMessage } from "@/components/common/ErrorMessage";
import { exportImage, outputSize } from "@/lib/renderEditor";
import { baseName, downloadBlob } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import type { ExportFormat } from "@/types/editor";

const FORMATS: { value: ExportFormat; label: string; note: string }[] = [
  { value: "png", label: "PNG", note: "Lossless, keeps transparency" },
  { value: "jpeg", label: "JPG", note: "Smaller file, no transparency" },
  { value: "webp", label: "WebP", note: "Small file, keeps transparency" },
];

type Status = "idle" | "exporting" | "done";

export function ExportDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const edit = useEditorStore((s) => s.edit);
  const fileName = useEditorStore((s) => s.fileName);
  const { width, height } = outputSize(edit);

  const transparent = edit.background.type === "transparent";
  const ext = format === "jpeg" ? "jpg" : format;
  const downloadName = `${baseName(fileName)}-${transparent ? "no-bg" : "edited"}.${ext}`;

  function open() {
    setStatus("idle");
    setError(null);
    dialogRef.current?.showModal();
  }

  async function download() {
    const { cutout, assets } = useEditorStore.getState();
    if (!cutout) return;
    setStatus("exporting");
    setError(null);
    try {
      const blob = await exportImage(edit, cutout, assets, format);
      downloadBlob(blob, downloadName);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
      setStatus("idle");
    }
  }

  return (
    <>
      <button onClick={open} className="btn-primary h-9 px-4 py-0">
        <Download className="size-3.5" /> Export
      </button>

      <dialog ref={dialogRef} className="card m-auto w-[calc(100%-2rem)] max-w-md p-0 text-body backdrop:bg-black/70 backdrop:backdrop-blur-sm">
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="heading text-xl">Export image</h2>
            <button aria-label="Close" onClick={() => dialogRef.current?.close()} className="icon-btn border-transparent">
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </div>

          <fieldset className="space-y-2">
            <legend className="sr-only">Format</legend>
            {FORMATS.map((f) => (
              <label key={f.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${format === f.value ? "border-rule-strong bg-raised text-ink" : "border-rule text-muted hover:text-ink"}`}>
                <input type="radio" name="format" value={f.value} checked={format === f.value} onChange={() => { setFormat(f.value); setStatus("idle"); }} className="accent-ink" />
                <span className="w-12 text-sm font-semibold">{f.label}</span>
                <span className="text-sm">{f.note}</span>
              </label>
            ))}
          </fieldset>

          {format === "jpeg" && transparent && (
            <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-sm text-amber-200">JPG can&apos;t store transparency, so a white background will be used.</p>
          )}

          <p className="mt-5 text-xs text-muted">
            {width} × {height} px · <span className="break-all">{downloadName}</span>
          </p>

          <button
            onClick={download}
            disabled={status === "exporting"}
            className="btn-primary mt-4 w-full py-3"
          >
            {status === "exporting" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            {status === "exporting" ? "Exporting…" : `Download ${FORMATS.find((f) => f.value === format)?.label}`}
          </button>
          {status === "done" && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="size-4" /> Download ready. Check your downloads folder.
            </p>
          )}
          {error && <ErrorMessage message={error} />}
        </div>
      </dialog>
    </>
  );
}
