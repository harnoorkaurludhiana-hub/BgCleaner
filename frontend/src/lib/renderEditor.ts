import type { Background, EditState, ExportFormat } from "@/types/editor";

// Safari's canvas limit; larger exports silently fail there.
export const MAX_EXPORT_PIXELS = 16_777_216;
export const MAX_EXPORT_DIMENSION = 8000;

export function outputSize(edit: EditState) {
  const height = Math.max(1, Math.round((edit.outputWidth * edit.canvasHeight) / edit.canvasWidth));
  return { width: edit.outputWidth, height };
}

/** Largest allowed export width for the current canvas aspect ratio. */
export function maxOutputWidth(edit: EditState) {
  const aspect = edit.canvasWidth / edit.canvasHeight;
  return Math.floor(Math.min(MAX_EXPORT_DIMENSION, MAX_EXPORT_DIMENSION * aspect, Math.sqrt(MAX_EXPORT_PIXELS * aspect)));
}

function drawBackground(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  bg: Background,
  w: number,
  h: number,
  assets: Record<string, ImageBitmap>,
) {
  if (bg.type === "color") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.type === "gradient") {
    // Angle 0 = left to right; the gradient line spans the canvas at that angle.
    const rad = (bg.angle * Math.PI) / 180;
    const half = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;
    const dx = Math.cos(rad) * half;
    const dy = Math.sin(rad) * half;
    const g = ctx.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy);
    g.addColorStop(0, bg.from);
    g.addColorStop(1, bg.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.type === "image") {
    const img = assets[bg.assetId];
    if (!img) return;
    // "Cover": fill the canvas, cropping the background image as needed.
    const s = Math.max(w / img.width, h / img.height);
    ctx.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
  }
}

/** Draws background + transformed cutout. `factor` scales canvas pixels to target pixels. */
export function renderEditor(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  edit: EditState,
  cutout: ImageBitmap,
  assets: Record<string, ImageBitmap>,
  factor: number,
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  drawBackground(ctx, edit.background, w, h, assets);

  ctx.save();
  ctx.translate(edit.x * factor, edit.y * factor);
  ctx.rotate((edit.rotation * Math.PI) / 180);
  ctx.scale(edit.scale * factor, edit.scale * factor);
  ctx.drawImage(cutout, -cutout.width / 2, -cutout.height / 2);
  ctx.restore();
}

const MIME: Record<ExportFormat, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

export async function exportImage(
  edit: EditState,
  cutout: ImageBitmap,
  assets: Record<string, ImageBitmap>,
  format: ExportFormat,
): Promise<Blob> {
  const { width, height } = outputSize(edit);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create an export canvas.");

  // JPG has no alpha: flatten a transparent background onto white instead of black.
  const edits = format === "jpeg" && edit.background.type === "transparent"
    ? { ...edit, background: { type: "color" as const, color: "#ffffff" } }
    : edit;
  renderEditor(ctx, edits, cutout, assets, width / edit.canvasWidth);

  const blob = await canvas.convertToBlob({ type: MIME[format], quality: format === "png" ? undefined : 0.92 });
  if (blob.type !== MIME[format]) throw new Error(`${format.toUpperCase()} export isn't supported in this browser.`);
  return blob;
}
