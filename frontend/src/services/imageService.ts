import { env } from "@/config/env";
import type { ApiFailure, ApiSuccess, ProcessedImage } from "@/types/image";

export class ApiError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export function mediaUrl(path: string) {
  return `${env.apiUrl}${path}`;
}

/**
 * Upload with XHR because fetch has no upload progress events.
 * onProgress gets 0-100 for the upload; once it hits 100 the server is processing.
 */
export function removeBackground(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${env.apiUrl}/api/v1/images/remove-bg`);
    xhr.responseType = "json";
    xhr.timeout = 5 * 60 * 1000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as ApiSuccess<ProcessedImage> | ApiFailure | null;
      if (xhr.status === 200 && body?.success) return resolve(body.data);
      if (body && !body.success) return reject(new ApiError(body.message, body.error.code));
      reject(new ApiError("Unexpected server response", "UNKNOWN"));
    };
    xhr.onerror = () => reject(new ApiError("Could not reach the server. Check your connection.", "NETWORK_ERROR"));
    xhr.ontimeout = () => reject(new ApiError("Processing took too long. Please try again.", "TIMEOUT"));
    xhr.onabort = () => reject(new ApiError("Upload cancelled", "ABORTED"));
    signal?.addEventListener("abort", () => xhr.abort());

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export async function getImage(imageId: string): Promise<ProcessedImage> {
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/api/v1/images/${encodeURIComponent(imageId)}`);
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", "NETWORK_ERROR");
  }
  const body = (await res.json().catch(() => null)) as ApiSuccess<ProcessedImage> | ApiFailure | null;
  if (res.ok && body?.success) return body.data;
  throw new ApiError(body?.message ?? "Unexpected server response", body && !body.success ? body.error.code : "UNKNOWN");
}

export async function fetchImageBlob(path: string): Promise<Blob> {
  const res = await fetch(mediaUrl(path));
  if (!res.ok) throw new ApiError("Image is no longer available. Please upload it again.", "IMAGE_NOT_FOUND");
  return res.blob();
}
