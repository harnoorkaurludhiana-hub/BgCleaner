import { Scissors } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Scissors className="size-4 text-muted" />
          <span>
            Bg<span className="text-muted">Cleaner</span>
          </span>
        </span>
        <span className="label">No account needed · Images stored temporarily · PNG, JPG & WebP</span>
      </div>
    </footer>
  );
}
