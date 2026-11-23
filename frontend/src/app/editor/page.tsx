import type { Metadata } from "next";
import { Suspense } from "react";

import { ImageEditor } from "@/components/editor/ImageEditor";

export const metadata: Metadata = { title: "Editor — BgCleaner" };

export default function EditorPage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense>
      <ImageEditor />
    </Suspense>
  );
}
