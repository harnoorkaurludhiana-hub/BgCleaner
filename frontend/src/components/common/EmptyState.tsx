import Link from "next/link";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md px-5 py-28 text-center">
      <p className="label">Nothing to edit</p>
      <h1 className="heading mt-3 text-3xl">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <Link href="/#upload" className="btn-primary mt-8">
        Upload an image
      </Link>
    </div>
  );
}
