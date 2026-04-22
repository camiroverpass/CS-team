"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, subDays, startOfDay, endOfDay, startOfMonth, startOfYear } from "date-fns";

const PRESETS = [
  { label: "Last 7 days", fn: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }) },
  { label: "Last 30 days", fn: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) },
  { label: "Last 90 days", fn: () => ({ from: startOfDay(subDays(new Date(), 90)), to: endOfDay(new Date()) }) },
  { label: "This month", fn: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: "This year", fn: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }) },
];

export default function DateRangePicker({ from, to, onChange }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ from, to });

  const apply = (r) => {
    if (r?.from && r?.to) {
      onChange({ from: startOfDay(r.from), to: endOfDay(r.to) });
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
      >
        {format(from, "MMM d, yyyy")} — {format(to, "MMM d, yyyy")}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-10 flex gap-4">
          <div className="flex flex-col gap-1 min-w-[140px]">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { const r = p.fn(); setRange(r); apply(r); }}
                className="text-left text-sm px-3 py-1.5 rounded hover:bg-slate-100"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <DayPicker
              mode="range"
              selected={range}
              onSelect={(r) => { setRange(r || {}); if (r?.from && r?.to) apply(r); }}
              numberOfMonths={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
