import { Download, Gauge, ImageUp, Lock, Maximize2, Paintbrush, Plus, Wand2 } from "lucide-react";

import { BeforeAfterSlider } from "@/components/preview/BeforeAfterSlider";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";

const formats = ["JPG", "PNG", "WebP", `Up to ${MAX_FILE_SIZE_MB} MB`];

const features = [
  { icon: Wand2, title: "Precise AI cutouts", text: "A segmentation model finds the subject and keeps fine edges clean." },
  { icon: Gauge, title: "Ready in seconds", text: "No masking or pen tool. Most images are done almost instantly." },
  { icon: Maximize2, title: "Full resolution", text: "Export at the original size with a true transparent alpha channel." },
  { icon: Paintbrush, title: "Built-in editor", text: "Swap in a colour, gradient or photo, then crop, rotate and resize." },
  { icon: Download, title: "PNG, JPG & WebP", text: "Download a transparent PNG or a flattened JPG or WebP." },
  { icon: Lock, title: "No account", text: "Nothing to sign up for. Uploads are stored only temporarily." },
];

const steps = [
  { icon: ImageUp, title: "Upload your image", text: "Drop a JPG, PNG or WebP, or browse your files." },
  { icon: Wand2, title: "AI removes the background", text: "The subject is separated automatically in seconds." },
  { icon: Download, title: "Edit and download", text: "Add a new background if you like, then export." },
];

const faqs = [
  { q: "Which image formats are supported?", a: `JPG, JPEG, PNG and WebP, up to ${MAX_FILE_SIZE_MB} MB per image.` },
  { q: "Do I need an account?", a: "No. Upload an image and download the result, with no sign-up." },
  { q: "What format is the result?", a: "A PNG with a transparent background at the same dimensions as your upload. In the editor you can also export JPG or WebP." },
  { q: "What happens to my images?", a: "They are stored temporarily so you can preview and download them, then deleted. Custom backgrounds never leave your browser." },
  { q: "What kinds of images work best?", a: "Photos with a clear main subject such as people, products, animals or objects. Very busy scenes are harder to separate." },
];

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="label">{eyebrow}</p>
      <h2 className="heading mt-3 text-3xl sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted">{text}</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section id="upload" className="relative scroll-mt-16 overflow-hidden">
        {/* Soft spotlight behind the hero. */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(255_255_255/0.07),transparent)]" />

        <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 text-center sm:pt-24">
          <span className="rise inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3 py-1 text-xs font-medium text-body">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
            Free · No sign-up · Full resolution
          </span>

          <h1 className="rise heading mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl [animation-delay:80ms]">
            Remove Image Backgrounds
            <br />
            <span className="fade-text">in Seconds.</span>
          </h1>
          <p className="rise mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg [animation-delay:160ms]">
            Remove image backgrounds instantly with AI. Upload your image and download a clean transparent image in seconds.
          </p>

          <div className="rise mx-auto mt-10 max-w-3xl text-left [animation-delay:240ms]">
            <ImageUploader />
          </div>

          <div className="rise mt-5 flex flex-wrap items-center justify-center gap-2 [animation-delay:320ms]">
            <span className="label mr-1">Supports</span>
            {formats.map((f) => (
              <span key={f} className="chip chip-off cursor-default">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="scroll-mt-16 px-5 pb-24">
        <SectionHead eyebrow="Example" title="See the difference" text="Drag the slider to compare the original with the cutout." />
        <div className="card mx-auto max-w-4xl overflow-hidden p-2">
          <div className="overflow-hidden rounded-xl">
            <BeforeAfterSlider before="/images/demo-before.svg" after="/images/demo-after.svg" alt="Demo plant" lazy />
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 px-5 pb-24">
        <SectionHead eyebrow="Features" title="Everything you need for clean cutouts" text="One focused tool, built to be fast and simple." />
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card group p-6 transition-colors hover:border-rule-strong hover:bg-[#0e0e11]">
              <span className="icon-tile transition-transform duration-300 group-hover:-translate-y-0.5">
                <Icon className="size-4.5" />
              </span>
              <h3 className="heading mt-5 text-base">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-16 px-5 pb-24">
        <SectionHead eyebrow="How it works" title="Three steps, no skills required" text="From upload to download in under a minute." />
        <ol className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="card relative p-6">
              <span className="absolute right-6 top-6 font-mono text-xs text-muted">0{i + 1}</span>
              <span className="icon-tile">
                <Icon className="size-4.5" />
              </span>
              <h3 className="heading mt-5 text-base">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="faq" className="scroll-mt-16 px-5 pb-24">
        <SectionHead eyebrow="FAQ" title="Frequently asked questions" text="Clear answers about formats, privacy and results." />
        <div className="mx-auto max-w-3xl space-y-2">
          {faqs.map(({ q, a }) => (
            <details key={q} className="card group px-5 py-4 open:border-rule-strong">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px] font-medium text-ink">
                {q}
                <Plus className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
