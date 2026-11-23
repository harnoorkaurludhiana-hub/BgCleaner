import { create } from "zustand";

import { maxOutputWidth } from "@/lib/renderEditor";
import type { EditState } from "@/types/editor";
import type { ProcessedImage } from "@/types/image";

interface EditorStore {
  image: ProcessedImage | null;
  fileName: string;
  /** The untouched transparent cutout. */
  cutout: ImageBitmap | null;
  /** Decoded custom background images, referenced by id from EditState. */
  assets: Record<string, ImageBitmap>;

  edit: EditState;
  /** Committed snapshots for undo/redo; history[historyIndex] is the last commit. */
  history: EditState[];
  historyIndex: number;

  setSource: (image: ProcessedImage, fileName: string) => void;
  load: (image: ProcessedImage, cutout: ImageBitmap) => void;
  addAsset: (bitmap: ImageBitmap) => string;
  /** Live change without a history entry (e.g. while dragging a slider). */
  set: (patch: Partial<EditState>) => void;
  /** Record the current state as an undo step, if it changed. */
  commit: () => void;
  /** set + commit, for one-shot actions like button clicks. */
  apply: (patch: Partial<EditState>) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export function initialEditState(width: number, height: number): EditState {
  const edit: EditState = {
    background: { type: "transparent" },
    canvasWidth: width,
    canvasHeight: height,
    outputWidth: width,
    scale: 1,
    rotation: 0,
    x: width / 2,
    y: height / 2,
  };
  return { ...edit, outputWidth: Math.min(width, maxOutputWidth(edit)) };
}

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorStore>((set, get) => ({
  image: null,
  fileName: "image",
  cutout: null,
  assets: {},
  edit: initialEditState(1, 1),
  history: [],
  historyIndex: -1,

  setSource: (image, fileName) => set({ image, fileName }),

  load: (image, cutout) => {
    const prev = get();
    prev.cutout?.close();
    Object.values(prev.assets).forEach((b) => b.close());
    const edit = initialEditState(cutout.width, cutout.height);
    set({
      image,
      fileName: prev.image?.image_id === image.image_id ? prev.fileName : "image",
      cutout,
      assets: {},
      edit,
      history: [edit],
      historyIndex: 0,
    });
  },

  addAsset: (bitmap) => {
    const id = crypto.randomUUID();
    set((s) => ({ assets: { ...s.assets, [id]: bitmap } }));
    return id;
  },

  set: (patch) => set((s) => ({ edit: { ...s.edit, ...patch } })),

  commit: () => {
    const { edit, history, historyIndex } = get();
    if (JSON.stringify(edit) === JSON.stringify(history[historyIndex])) return;
    const next = [...history.slice(0, historyIndex + 1), edit].slice(-MAX_HISTORY);
    set({ history: next, historyIndex: next.length - 1 });
  },

  apply: (patch) => {
    get().set(patch);
    get().commit();
  },

  undo: () => {
    get().commit(); // keep any uncommitted live change so redo can return to it
    const { history, historyIndex } = get();
    if (historyIndex === 0) return;
    set({ historyIndex: historyIndex - 1, edit: history[historyIndex - 1] });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    set({ historyIndex: historyIndex + 1, edit: history[historyIndex + 1] });
  },

  reset: () => {
    const { cutout } = get();
    if (cutout) get().apply(initialEditState(cutout.width, cutout.height));
  },
}));
