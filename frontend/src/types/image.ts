export interface ProcessedImage {
  image_id: string;
  original_url: string;
  processed_url: string;
  width: number;
  height: number;
  format: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  error: { code: string };
}

export type UploadStatus = "idle" | "selected" | "uploading" | "processing" | "done" | "error";
