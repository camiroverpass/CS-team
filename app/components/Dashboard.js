"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import DateRangePicker from "./DateRangePicker.js";

function KpiCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function fmtHours(h) {
  if (h == null) return "—";
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function Dashboard() {
  const [from, setFrom] = useState(() => startOfDay(subDays(new Date(), 30)));
  const [to, setTo] = useState(() => endOfDay(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useMemo(
    () => `?from=${from.toISOString()}&to=${to.toISOString()}`,
    [from, to]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/metrics${query}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Dashboard</h1>
          <p className="text-sm text-slate-500">Zoho Desk ticket analytics</p>
        </div>
        <DateRangePicker from={from} to={to} onChange={(r) => { setFrom(r.from); setTo(r.to); }} />
      </header>

      {loading && <div className="text-slate-500">Loading…</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          Error: {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total tickets" value={data.totals.total} sub={`${format(from, "MMM d")} – ${format(to, "MMM d")}`} />
            <KpiCard label="Open" value={data.totals.open} />
            <KpiCard label="Closed" value={data.totals.closed} />
            <KpiCard
              label="Avg time to close"
              value={fmtHours(data.closeTime.avg_hours)}
              sub={`Median: ${fmtHours(data.closeTime.median_hours)}`}
            />
          </div>

          <Panel title="Tickets created per day">
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={data.createdSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#93c5fd" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel title="Tickets by problem">
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={data.byProblem} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="problem" tick={{ fontSize: 12 }} width={140} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Avg time to close (per day)">
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={data.closeTime.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(0)}h`} />
                    <Tooltip formatter={(v) => fmtHours(v)} />
                    <Line type="monotone" dataKey="avg_hours" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={`Open tickets (${data.openTickets.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Problem</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.openTickets.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-mono text-slate-600">{t.ticket_number}</td>
                      <td className="py-2 pr-4">{t.subject}</td>
                      <td className="py-2 pr-4 text-slate-600">{t.problem || "—"}</td>
                      <td className="py-2 pr-4 text-slate-500">
                        {t.created_time ? format(new Date(t.created_time), "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.openTickets.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No open tickets in range</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </main>
  );
}
