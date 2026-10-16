"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface LoadErrorProps {
  message: string;
  retryLabel: string;
  retryingLabel: string;
}

/** A failed server-side read: says so and re-runs the page's server render (router.refresh). */
export default function LoadError({ message, retryLabel, retryingLabel }: LoadErrorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div role="alert" className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center gap-3 text-center">
      <p className="text-sm font-semibold text-gray-700">{message}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
      >
        {pending ? retryingLabel : retryLabel}
      </button>
    </div>
  );
}
