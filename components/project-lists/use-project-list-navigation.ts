"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function mergeSearchParams(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}

function resetsPageToOne(updates: Record<string, string | undefined | null>) {
  return [
    "query",
    "orderBy",
    "order",
    "limit",
    "pub",
    "ptype",
    "when",
    "award",
    "urole",
    "ustatus",
    "mrole",
    "mstatus",
  ].some((k) => Object.prototype.hasOwnProperty.call(updates, k));
}

export function useProjectListNavigation(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pushParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = mergeSearchParams(searchParams, updates);
      if (resetsPageToOne(updates) && !("page" in updates)) {
        next.set("page", "1");
      }
      const q = next.toString();
      startTransition(() => {
        router.replace(q ? `${basePath}?${q}` : basePath, { scroll: false });
      });
    },
    [basePath, router, searchParams],
  );

  return { pushParams, isPending, searchParams };
}
