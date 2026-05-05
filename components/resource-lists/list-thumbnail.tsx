"use client";

import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const PLACEHOLDER_GRADIENTS = [
  "from-sky-500/45 via-blue-600/35 to-indigo-700/40",
  "from-emerald-500/45 via-teal-600/35 to-cyan-700/40",
  "from-violet-500/45 via-purple-600/35 to-fuchsia-700/35",
  "from-amber-500/45 via-orange-500/35 to-rose-600/35",
  "from-slate-500/40 via-slate-600/35 to-slate-800/45",
  "from-primary/50 via-primary/35 to-indigo-600/40",
] as const;

function gradientIndex(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % PLACEHOLDER_GRADIENTS.length;
}

/** Gradiente estable por `seed` (p. ej. id) para portadas sin imagen. */
export function listPlaceholderGradientClass(seed: string) {
  return `bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[gradientIndex(seed)]}`;
}

export function ListThumbnail({
  src,
  alt,
  className,
  seed,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  /** Para color estable del placeholder cuando no hay imagen (p. ej. id del registro). */
  seed?: string;
}) {
  const key = seed ?? alt;
  const grad = PLACEHOLDER_GRADIENTS[gradientIndex(key)];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        className={cn("h-12 w-20 shrink-0 rounded-lg border border-border object-cover", className)}
        height={48}
        loading="lazy"
        src={src}
        width={80}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br text-white/90 shadow-inner",
        grad,
        className,
      )}
    >
      <ImageIcon className="h-5 w-5 opacity-90 drop-shadow-sm" />
    </div>
  );
}
