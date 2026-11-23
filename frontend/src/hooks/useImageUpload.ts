"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ACCEPTED_TYPES, MAX_FILE_SIZE_MB, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS } from "@/lib/constants";
import { ApiError, removeBackground } from "@/services/imageService";
import type { ProcessedImage, UploadStatus } from "@/types/image";

async function validateFile(file: File): Promise<string | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    if (Math.max(width, height) > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
      return `Image is too large. Maximum is ${MAX_IMAGE_DIMENSION}px on the longest side.`;
    }
  } catch {
    return "This image looks corrupted or can't be read.";
  }
  return null;
}

export function useImageUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Revoke the previous object URL whenever it changes or on unmount.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const process = useCallback(async (target: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("uploading");
    setProgress(0);
    setError(null);
    try {
      const data = await removeBackground(
        target,
        (p) => {
          setProgress(p);
          if (p === 100) setStatus("processing");
        },
        controller.signal,
      );
      setResult(data);
      setStatus("done");
    } catch (e) {
      if (e instanceof ApiError && e.code === "ABORTED") return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  const selectFile = useCallback(
    async (selected: File) => {
      const problem = await validateFile(selected);
      if (problem) {
        setError(problem);
        setStatus(file ? "selected" : "idle");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      process(selected);
    },
    [file, process],
  );

  const retry = useCallback(() => { if (file) process(file); }, [file, process]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, file, previewUrl, progress, result, error, selectFile, retry, reset };
}
