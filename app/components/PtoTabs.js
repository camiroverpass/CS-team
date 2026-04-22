"use client";

import { useState } from "react";

function PtoTable({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-400 text-sm">
        No PTO entries yet.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600 border-b border-slate-200">
          <tr>
            <th className="py-2 px-4 font-semibold">Start Date</th>
            <th className="py-2 px-4 font-semibold">End Date</th>
            <th className="py-2 px-4 font-semibold">Hours</th>
            <th className="py-2 px-4 font-semibold">Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-4 text-slate-700">{r.startDate || "—"}</td>
              <td className="py-2 px-4 text-slate-700">{r.endDate || "—"}</td>
              <td className="py-2 px-4 text-slate-700">{r.hours || "—"}</td>
              <td className="py-2 px-4 text-slate-700">{r.type || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBlock({ rows }) {
  if (rows.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((cols, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {cols.map((c, j) => (
                <td
                  key={j}
                  className={
                    "py-2 px-4 align-top " +
                    (j === 0 ? "text-slate-700 font-medium w-64" : "text-slate-600")
                  }
                >
                  {c || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PtoTabs({ people }) {
  const [active, setActive] = useState(people[0]?.name ?? "");
  const current = people.find((p) => p.name === active) ?? people[0];
  if (!current) return null;

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {people.map((p) => {
          const isActive = p.name === active;
          return (
            <button
              key={p.name}
              onClick={() => setActive(p.name)}
              className={
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition " +
                (isActive
                  ? "border-roverpass-500 text-roverpass-700"
                  : "border-transparent text-slate-500 hover:text-slate-800")
              }
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {current.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 text-sm mb-6">
          <div className="font-semibold">Could not load {current.name}&apos;s sheet</div>
          <div className="mt-1">{current.error}</div>
        </div>
      )}

      {!current.error && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              PTO taken
            </h2>
            <PtoTable rows={current.ptoRows} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">
              Summary &amp; Holidays
            </h2>
            <SummaryBlock rows={current.summary} />
          </section>
        </div>
      )}
    </div>
  );
}
