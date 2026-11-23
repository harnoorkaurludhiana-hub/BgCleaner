"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { BackgroundSelector } from "@/components/editor/BackgroundSelector";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ImageControls } from "@/components/editor/ImageControls";
import { renderEditor } from "@/lib/renderEditor";
import { ApiError, fetchImageBlob, getImage } from "@/services/imageService";
import { useEditorStore } from "@/stores/editorStore";

// Preview is drawn at most this many pixels wide/tall; export uses full resolution.
const PREVIEW_MAX = 1600;

function EditorCanvas() {
  const edit = useEditorStore((s) => s.edit);
  const cutout = useEditorStore((s) => s.cutout);
  const assets = useEditorStore((s) => s.assets);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const factor = Math.min(1, PREVIEW_MAX / Math.max(edit.canvasWidth, edit.canvasHeight));
  const width = Math.round(edit.canvasWidth * factor);
  const height = Math.round(edit.canvasHeight * factor);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && cutout) renderEditor(ctx, edit, cutout, assets, factor);
  }, [edit, cutout, assets, factor, width, height]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: edit.x, y: edit.y };
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    // Convert on-screen pixels to canvas pixels.
    const ratio = edit.canvasWidth / e.currentTarget.getBoundingClientRect().width;
    useEditorStore.getState().set({
      x: drag.current.x + (e.clientX - drag.current.px) * ratio,
      y: drag.current.y + (e.clientY - drag.current.py) * ratio,
    });
  }

  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    useEditorStore.getState().commit();
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-label="Image editor canvas. Drag to move the subject."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="checkerboard max-h-[60vh] max-w-full cursor-move touch-none rounded-lg outline outline-1 outline-rule-strong lg:max-h-[calc(100vh-12rem)]"
    />
  );
}

type LoadStatus = "loading" | "ready" | "missing" | "error";

export function ImageEditor() {
  const imageId = useSearchParams().get("id");
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!imageId) return;
    let cancelled = false;
    (async () => {
      try {
        const image = await getImage(imageId);
        const cutout = await createImageBitmap(await fetchImageBlob(image.processed_url));
        if (cancelled) return cutout.close();
        useEditorStore.getState().load(image, cutout);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.code === "IMAGE_NOT_FOUND") return setStatus("missing");
        setError(e instanceof Error ? e.message : "Could not load the image.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageId, attempt]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      if (e.target instanceof HTMLInputElement && e.target.type !== "range") return; // let text fields undo text
      e.preventDefault();
      const { undo, redo } = useEditorStore.getState();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!imageId || status === "missing") {
    return <EmptyState title="No image to edit" text="This image doesn't exist or has expired. Upload an image to get started." />;
  }
  if (status === "loading") {
    return (
      <div className="label flex items-center justify-center gap-3 py-32">
        <Loader2 className="size-4 animate-spin text-ink" /> Loading editor
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        {error && <ErrorMessage message={error} />}
        <button
          onClick={() => {
            setStatus("loading");
            setAttempt((a) => a + 1);
          }}
          className="btn-primary mt-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <EditorToolbar />
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-1 items-center justify-center bg-surface p-4 sm:p-10">
          <EditorCanvas />
        </div>
        <aside className="space-y-7 border-rule bg-paper p-5 lg:w-80 lg:border-l">
          <BackgroundSelector />
          <ImageControls />
        </aside>
      </div>
    </div>
  );
}
