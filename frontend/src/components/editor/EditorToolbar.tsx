"use client";

import Link from "next/link";
import { ArrowLeft, Redo2, RotateCcw, Undo2 } from "lucide-react";

import { ExportDialog } from "@/components/editor/ExportDialog";
import { useEditorStore } from "@/stores/editorStore";

export function EditorToolbar() {
  const canUndo = useEditorStore((s) => s.historyIndex > 0);
  const canRedo = useEditorStore((s) => s.historyIndex < s.history.length - 1);
  const { undo, redo, reset } = useEditorStore.getState();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper px-4 py-2.5">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> New image
      </Link>
      <div className="flex items-center gap-2">
        <button aria-label="Undo" title="Undo (Ctrl+Z)" className="icon-btn" disabled={!canUndo} onClick={undo}>
          <Undo2 className="size-4" strokeWidth={1.5} />
        </button>
        <button aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className="icon-btn" disabled={!canRedo} onClick={redo}>
          <Redo2 className="size-4" strokeWidth={1.5} />
        </button>
        <button title="Reset all edits" className="btn-ghost h-9 px-3.5 py-0" onClick={reset}>
          <RotateCcw className="size-3.5" /> Reset
        </button>
        <ExportDialog />
      </div>
    </div>
  );
}
