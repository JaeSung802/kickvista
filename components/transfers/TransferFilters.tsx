"use client";

import { useId, useState } from "react";

/**
 * Phones: the sort group stays visible next to a "Filters (n)" button; team/search/period/type sit in a
 * panel that opens on demand, with a one-line summary of the current selection while it is closed.
 * From the `sm` breakpoint up the panel is always shown and the button is hidden. The panel is only
 * hidden, never unmounted, so every control keeps its current value.
 */
export default function TransferFilters({ label, activeCount, summary, sortRow, children }: {
  label: string; activeCount: number; summary: string; sortRow: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex flex-col gap-2" data-transfers-filters="">
      <div className="order-1 flex items-center justify-between gap-2 sm:order-2">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)} data-transfers-filter-toggle=""
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold sm:hidden ${open || activeCount ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-700"}`}>
          {label}{activeCount > 0 && <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] text-white">{activeCount}</span>}
          <span aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
        <div className="min-w-0 sm:flex-1">{sortRow}</div>
      </div>
      {!open && <p className="order-1 truncate text-xs text-gray-500 sm:hidden" data-transfers-filter-summary="">{summary}</p>}
      <div id={id} className={`${open ? "flex" : "hidden"} order-2 flex-col gap-2 sm:order-1 sm:flex`} data-transfers-panel={open ? "open" : "closed"}>
        {children}
      </div>
    </div>
  );
}
