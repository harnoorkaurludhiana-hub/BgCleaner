export type Background =
  | { type: "transparent" }
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "image"; assetId: string };

/**
 * Everything the user can change. Kept separate from the cutout itself,
 * which is never modified. Coordinates are in canvas pixels.
 */
export interface EditState {
  background: Background;
  canvasWidth: number;
  canvasHeight: number;
  /** Export width; height follows the canvas aspect ratio. */
  outputWidth: number;
  /** Subject scale, 1 = original pixel size. */
  scale: number;
  /** Subject rotation in degrees. */
  rotation: number;
  /** Subject center. */
  x: number;
  y: number;
}

export type ExportFormat = "png" | "jpeg" | "webp";
