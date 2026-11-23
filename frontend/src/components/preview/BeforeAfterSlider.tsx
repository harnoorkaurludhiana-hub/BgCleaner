"use client";

import { useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface Props {
  before: string;
  after: string;
  alt: string;
  lazy?: boolean;
}

/** Both images must share the same aspect ratio. Reset by changing the component's `key`. */
export function BeforeAfterSlider({ before, after, alt, lazy }: Props) {
  const [position, setPosition] = useState(50);
  const loading = lazy ? "lazy" : undefined;

  return (
    <div className="relative select-none overflow-hidden">
      <div className="checkerboard">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic/remote image */}
        <img src={after} alt={`${alt} without background`} loading={loading} draggable={false} className="block w-full" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic/remote image */}
      <img
        src={before}
        alt={`${alt} original`}
        loading={loading}
        draggable={false}
        className="absolute inset-0 size-full"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">Before</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-black">After</span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgb(0_0_0/0.5)]" style={{ left: `${position}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
          <ChevronsLeftRight className="size-4" strokeWidth={1.5} />
        </span>
      </div>

      {/* A native range input gives keyboard, mouse and touch support for free. */}
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
