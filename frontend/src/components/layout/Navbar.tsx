import Link from "next/link";
import { CircleHelp, Layers, Scissors, Sparkles } from "lucide-react";

const links = [
  { href: "/#features", label: "Features", icon: Sparkles },
  { href: "/#how-it-works", label: "How it works", icon: Layers },
  { href: "/#faq", label: "FAQ", icon: CircleHelp },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/80 backdrop-blur-xl">
      <nav className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-5 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="icon-tile size-9">
            <Scissors className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Bg<span className="text-muted">Cleaner</span>
          </span>
        </Link>

        {/* Secondary links are hidden on small screens; the upload CTA stays visible. */}
        <div className="hidden items-center gap-1 rounded-full border border-rule bg-surface p-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-body transition-colors hover:bg-raised hover:text-ink">
              <Icon className="size-3.5 text-muted" /> {label}
            </Link>
          ))}
        </div>

        <div className="flex justify-end">
          <Link href="/#upload" className="btn-primary px-4 py-2 text-[13px]">
            Upload Image
          </Link>
        </div>
      </nav>
    </header>
  );
}
