import { beforeEach, describe, expect, it } from "vitest";

import { MAX_EXPORT_PIXELS, maxOutputWidth, outputSize } from "@/lib/renderEditor";
import { baseName } from "@/lib/utils";
import { initialEditState, useEditorStore } from "@/stores/editorStore";

const image = { image_id: "abc", original_url: "", processed_url: "", width: 800, height: 600, format: "PNG" };
const cutout = { width: 800, height: 600, close() {} } as unknown as ImageBitmap;
const store = () => useEditorStore.getState();

describe("editor history", () => {
  beforeEach(() => store().load(image, cutout));

  it("starts from the untouched cutout", () => {
    expect(store().edit).toEqual(initialEditState(800, 600));
    expect(store().historyIndex).toBe(0);
  });

  it("undoes and redoes committed changes", () => {
    store().apply({ background: { type: "color", color: "#ffffff" } });
    store().apply({ rotation: 90 });
    store().undo();
    expect(store().edit.rotation).toBe(0);
    expect(store().edit.background).toEqual({ type: "color", color: "#ffffff" });
    store().undo();
    expect(store().edit.background).toEqual({ type: "transparent" });
    store().undo(); // no-op at the start
    expect(store().historyIndex).toBe(0);
    store().redo();
    store().redo();
    expect(store().edit.rotation).toBe(90);
  });

  it("records a slider drag as one step and keeps it for redo", () => {
    store().set({ scale: 1.2 });
    store().set({ scale: 1.5 });
    store().undo(); // commits the live change first, then steps back
    expect(store().edit.scale).toBe(1);
    store().redo();
    expect(store().edit.scale).toBe(1.5);
  });

  it("drops redo history after a new change", () => {
    store().apply({ rotation: 45 });
    store().undo();
    store().apply({ rotation: 10 });
    store().redo();
    expect(store().edit.rotation).toBe(10);
  });

  it("reset is undoable", () => {
    store().apply({ scale: 2 });
    store().reset();
    expect(store().edit).toEqual(initialEditState(800, 600));
    store().undo();
    expect(store().edit.scale).toBe(2);
  });
});

describe("export size", () => {
  it("keeps the canvas aspect ratio", () => {
    const edit = { ...initialEditState(800, 600), outputWidth: 1200 };
    expect(outputSize(edit)).toEqual({ width: 1200, height: 900 });
  });

  it("caps export width to the browser canvas limit", () => {
    const edit = initialEditState(5000, 5000);
    const max = maxOutputWidth(edit);
    expect(max * max).toBeLessThanOrEqual(MAX_EXPORT_PIXELS);
    expect(edit.outputWidth).toBe(max);
  });
});

describe("download filename", () => {
  it("is safe and readable", () => {
    expect(baseName("My Photo.final.JPG")).toBe("my-photo-final");
    expect(baseName("IMG_2041 (copy) #2.webp")).toBe("img-2041-copy-2");
    expect(baseName("../../etc/passwd")).not.toContain("/");
    expect(baseName("....png")).toBe("image");
  });
});
