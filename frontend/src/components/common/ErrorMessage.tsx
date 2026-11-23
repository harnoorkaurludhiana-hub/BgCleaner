import { AlertCircle } from "lucide-react";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-left text-sm text-red-300">
      <AlertCircle className="size-4 shrink-0" /> {message}
    </p>
  );
}
