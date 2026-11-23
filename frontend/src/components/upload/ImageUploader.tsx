"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, RotateCcw, X } from "lucide-react";

import { ErrorMessage } from "@/components/common/ErrorMessage";
import { ImagePreview } from "@/components/preview/ImagePreview";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ACCEPT_ATTR } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

export function ImageUploader() {
  const { status, file, previewUrl, progress, result, error, selectFile, retry, reset } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const busy = status === "uploading" || status === "processing";

  function onFiles(files: FileList | null) {
    if (files?.[0]) selectFile(files[0]);
    if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
  }

  if (status === "done" && result && file) {
    return <ImagePreview result={result} fileName={file.name} onReset={reset} />;
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {previewUrl && file ? (
        <div className="card overflow-hidden p-2">
          <div className="relative overflow-hidden rounded-xl bg-raised">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img src={previewUrl} alt="Selected image" className={`mx-auto max-h-96 object-contain transition duration-500 ${busy ? "scale-[0.99] opacity-40 blur-[1px]" : ""}`} />
            {busy && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex items-center gap-2.5 rounded-full border border-rule-strong bg-paper/80 px-4 py-2 text-sm font-medium text-ink backdrop-blur">
                  <Loader2 className="size-4 animate-spin" />
                  {status === "uploading" ? `Uploading… ${progress}%` : "Removing background…"}
                </div>
              </div>
            )}
          </div>

          {busy && (
            <div className="mx-1 mt-2 h-1 overflow-hidden rounded-full bg-raised">
              <div className={`h-full rounded-full bg-ink transition-all ${status === "processing" ? "animate-pulse" : ""}`} style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1 pt-3">
            <span className="min-w-0 truncate text-sm text-muted">
              {status === "processing" ? "Separating the subject. Usually takes a few seconds." : `${file.name} · ${formatBytes(file.size)}`}
            </span>
            <div className="flex gap-2">
              {status === "error" && (
                <button onClick={retry} className="btn-primary px-4 py-2">
                  <RotateCcw className="size-3.5" /> Retry
                </button>
              )}
              <button onClick={reset} className="btn-ghost px-4 py-2">
                <X className="size-3.5" /> {busy ? "Cancel" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
          className="card group cursor-pointer p-2 outline-none transition-colors hover:border-rule-strong focus-visible:border-ink"
        >
          <div
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center transition-all duration-300 sm:py-20 ${
              dragging ? "border-ink bg-raised" : "border-rule-strong bg-[radial-gradient(ellipse_at_top,rgb(255_255_255/0.04),transparent_70%)]"
            }`}
          >
            <span className={`icon-tile size-12 transition-transform duration-300 ${dragging ? "scale-110" : "group-hover:-translate-y-1"}`}>
              <ImageUp className="size-5" />
            </span>
            <p className="heading mt-5 text-lg">{dragging ? "Release to upload" : "Drop an image to remove its background"}</p>
            <p className="mt-1 text-sm text-muted">or click to browse your files</p>
            <span className="btn-primary mt-6">Upload Image</span>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
