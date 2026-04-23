"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfDay, endOfDay, startOfMonth, subMonths, formatDistanceToNow } from "date-fns";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Area,
  LineChart,
  Line,
} from "recharts";

const TIME_RANGES = [
  { key: "month", label: "This month" },
  { key: "6months", label: "Last 6 months" },
  { key: "12months", label: "Last 12 months" },
];

function rangeFor(key) {
  const now = new Date();
  if (key === "month") return { from: startOfMonth(now), to: endOfDay(now) };
  if (key === "6months") return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now) };
  return { from: startOfDay(subMonths(now, 12)), to: endOfDay(now) };
}

function TimeRangeSelector({ value, onChange, compare, onToggleCompare }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Time range</span>
      <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
        {TIME_RANGES.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              value === o.key
                ? "bg-brand-coral text-white shadow-sm"
                : "text-brand-navy hover:bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={compare}
          onChange={(e) => onToggleCompare(e.target.checked)}
          className="accent-brand-coral"
        />
        Compare to previous year
      </label>
    </div>
  );
}

function Delta({ current, previous, inverted }) {
  if (previous == null || current == null) return null;
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const pct = previous === 0 ? null : (diff / previous) * 100;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const positive = inverted ? isDown : isUp;
  const negative = inverted ? isUp : isDown;
  const cls = positive
    ? "text-brand-green"
    : negative
    ? "text-brand-red"
    : "text-slate-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "•";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
      <span>{arrow}</span>
      <span>
        {pct == null ? "new" : `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`}
      </span>
    </span>
  );
}

function KpiCard({ label, value, currentNum, sub, active, onClick, previous, prevDisplay, inverted }) {
  const Tag = onClick ? "button" : "div";
  const deltaCurrent = currentNum != null ? currentNum : (typeof value === "number" ? value : null);
  return (
    <Tag
      onClick={onClick}
      className={`text-left w-full bg-white rounded-2xl shadow-sm border p-5 transition-all ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-md" : ""
      } ${active ? "border-brand-coral ring-2 ring-brand-coral/20" : "border-slate-200"}`}
    >
      <div
        className={`text-xs font-semibold tracking-wider uppercase ${
          active ? "text-brand-coral" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-brand-navy">{value}</span>
        {previous != null && deltaCurrent != null && (
          <Delta current={deltaCurrent} previous={previous} inverted={inverted} />
        )}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
      {prevDisplay != null && (
        <div className="mt-1 text-xs text-slate-400">prev year: {prevDisplay}</div>
      )}
    </Tag>
  );
}

const CARD_TITLES = {
  total: "All tickets",
  open: "Open tickets",
  closed: "Closed tickets",
  avgclose: "Closed tickets (slowest first)",
};

function StatusPill({ status, statusType }) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const cls =
    statusType === "Closed"
      ? "bg-brand-greenSoft text-brand-green"
      : statusType === "On Hold"
      ? "bg-brand-orangeSoft text-brand-orange"
      : "bg-brand-coralSoft text-brand-coral";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function TicketRows({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return <div className="text-center text-slate-400 py-10 text-sm">No tickets</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-20" />
          <col className="w-[40%]" />
          <col className="w-40" />
          <col className="w-44" />
          <col className="w-32" />
          <col className="w-24" />
        </colgroup>
        <thead>
          <tr className="text-left border-b border-slate-200">
            <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">#</th>
            <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Subject</th>
            <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Status</th>
            <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Problem</th>
            <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Created</th>
            <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">Close time</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const href = t.url || `https://desk.zoho.com/support/roverpass/ShowHomePage.do#Cases/dv/${t.id}`;
            return (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="py-3 pr-4 font-mono text-slate-500">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">#{t.ticket_number}</a>
                </td>
                <td className="py-3 pr-4 text-brand-navy font-medium">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t.subject || ""}
                    className="block truncate hover:text-brand-coral"
                  >
                    {t.subject || "—"}
                  </a>
                </td>
                <td className="py-3 pr-4">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block"><StatusPill status={t.status} statusType={t.statusType} /></a>
                </td>
                <td className="py-3 pr-4">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {t.problem ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-coralSoft text-brand-coral text-xs font-medium">
                        {t.problem}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </a>
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {t.created_time ? format(new Date(t.created_time), "MMM d, yyyy") : "—"}
                  </a>
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {t.close_hours != null ? fmtHours(t.close_hours) : "—"}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-brand-navy">{title}</h3>
        {right && <div className="text-xs text-slate-400">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function ProblemList({ rows, selected, onSelect }) {
  if (!rows || rows.length === 0) {
    return <div className="text-center text-slate-400 py-10 text-sm">No data in range</div>;
  }
  const sorted = [...rows].sort((a, b) => (b.count || 0) - (a.count || 0));
  const max = Math.max(...sorted.map((r) => r.count || 0), 1);
  const total = sorted.reduce((s, r) => s + (r.count || 0), 0);

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1 -mx-2">
      {sorted.map((row) => {
        const name = row.problem || "Unspecified";
        const count = row.count || 0;
        const pct = (count / max) * 100;
        const share = total > 0 ? Math.round((count / total) * 100) : 0;
        const isActive = selected === name;
        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`w-full text-left px-2 py-2 rounded-lg transition-colors ${
              isActive ? "bg-brand-coralSoft" : "hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <span className={`text-sm truncate ${isActive ? "font-bold text-brand-coral" : "font-medium text-brand-navy"}`}>
                {name}
              </span>
              <span className="flex items-baseline gap-2 shrink-0">
                <span className={`text-sm font-bold tabular-nums ${isActive ? "text-brand-coral" : "text-brand-navy"}`}>{count}</span>
                <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{share}%</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-coral rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function mergeSeries(current, previous) {
  if (!previous || previous.length === 0) return current || [];
  const byDay = new Map();
  for (const d of current || []) {
    byDay.set(d.day, { day: d.day, count: d.count });
  }
  for (const d of previous) {
    const existing = byDay.get(d.day);
    if (existing) existing.previous = d.count;
    else byDay.set(d.day, { day: d.day, previous: d.count });
  }
  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
}

function fmtHours(h) {
  if (h == null) return "—";
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const { from, to } = useMemo(() => rangeFor(timeRange), [timeRange]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastFetched, setLastFetched] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [selectedCard, setSelectedCard] = useState("open");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [compare, setCompare] = useState(false);

  const selectCard = (key) => {
    setSelectedCard(key);
    setSelectedProblem(null);
  };
  const selectProblem = (name) => {
    setSelectedProblem((prev) => (prev === name ? null : name));
    setSelectedCard(null);
  };

  const filteredTickets = useMemo(() => {
    if (!data?.tickets) return [];
    const isClosed = (t) => t.statusType === "Closed";
    if (selectedProblem) {
      return data.tickets.filter((t) => (t.problem || "Unspecified") === selectedProblem);
    }
    if (selectedCard === "total") return data.tickets;
    if (selectedCard === "open") return data.tickets.filter((t) => !isClosed(t));
    if (selectedCard === "closed") return data.tickets.filter((t) => isClosed(t));
    if (selectedCard === "avgclose") {
      return data.tickets
        .filter((t) => isClosed(t) && t.close_hours != null)
        .sort((a, b) => (b.close_hours || 0) - (a.close_hours || 0));
    }
    return [];
  }, [data, selectedCard, selectedProblem]);

  const query = useMemo(
    () => `?from=${from.toISOString()}&to=${to.toISOString()}${compare ? "&compare=1" : ""}`,
    [from, to, compare]
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
        setLastFetched(new Date());
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const liveLabel = lastFetched
    ? `Live · Updated ${formatDistanceToNow(lastFetched, { addSuffix: true, baseDate: now })}`
    : "Live · Updating…";

  return (
    <main>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-coral flex items-center justify-center text-white font-bold text-xl shadow-sm">
              R
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy leading-tight">RoverPass</h1>
              <p className="text-[11px] font-semibold text-slate-500 tracking-[0.15em]">SUPPORT DASHBOARD</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="relative inline-flex">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-green"></span>
                <span className="absolute inset-0 inline-block w-2 h-2 rounded-full bg-brand-green opacity-75 animate-ping"></span>
              </span>
              <span>{liveLabel}</span>
            </div>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-brand-navy hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">Overview</h2>
          </div>
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            compare={compare}
            onToggleCompare={setCompare}
          />
        </div>

        {loading && !data && <div className="text-slate-500">Loading…</div>}
        {error && (
          <div className="bg-brand-coralSoft border border-brand-coral/30 text-brand-red rounded-xl p-4">
            Error: {error}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total tickets"
                value={data.totals.total}
                sub={`${format(from, "MMM d")} – ${format(to, "MMM d")}`}
                active={selectedCard === "total"}
                onClick={() => selectCard("total")}
                previous={data.previous?.totals?.total}
                prevDisplay={data.previous?.totals?.total}
              />
              <KpiCard
                label="Open"
                value={data.totals.open}
                active={selectedCard === "open"}
                onClick={() => selectCard("open")}
                previous={data.previous?.totals?.open}
                prevDisplay={data.previous?.totals?.open}
              />
              <KpiCard
                label="Closed"
                value={data.totals.closed}
                active={selectedCard === "closed"}
                onClick={() => selectCard("closed")}
                previous={data.previous?.totals?.closed}
                prevDisplay={data.previous?.totals?.closed}
              />
              <KpiCard
                label="Avg time to close"
                value={fmtHours(data.closeTime.avg_hours)}
                currentNum={data.closeTime.avg_hours}
                sub={`Median: ${fmtHours(data.closeTime.median_hours)}`}
                active={selectedCard === "avgclose"}
                onClick={() => selectCard("avgclose")}
                previous={data.previous?.closeTime?.avg_hours}
                prevDisplay={data.previous?.closeTime?.avg_hours != null ? fmtHours(data.previous.closeTime.avg_hours) : null}
                inverted
              />
            </div>

            <Panel title="Tickets created per day" right={compare && data.previous ? "Current vs. previous year" : null}>
              <div className="h-40">
                <ResponsiveContainer>
                  <ComposedChart data={mergeSeries(data.createdSeries, data.previous?.createdSeries)}>
                    <defs>
                      <linearGradient id="coralFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F06060" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#F06060" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748B" }} allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    {compare && data.previous && (
                      <Line type="monotone" dataKey="previous" name="Prev year" stroke="#94A3B8" strokeWidth={1.75} strokeDasharray="4 4" dot={false} />
                    )}
                    <Area type="monotone" dataKey="count" name="Current" stroke="#F06060" strokeWidth={2.5} fill="url(#coralFill)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Panel title="Tickets by problem" right={`${data.byProblem.length} categories · click to filter`}>
                <ProblemList rows={data.byProblem} selected={selectedProblem} onSelect={selectProblem} />
              </Panel>

              <Panel title="Avg time to close (per day)">
                <div className="h-72">
                  <ResponsiveContainer>
                    <LineChart data={data.closeTime.series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `${v.toFixed(0)}h`} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} formatter={(v) => fmtHours(v)} />
                      <Line type="monotone" dataKey="avg_hours" stroke="#1E2F3D" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <Panel
              title={
                selectedProblem
                  ? `Tickets with problem: ${selectedProblem}`
                  : CARD_TITLES[selectedCard] || "Tickets"
              }
              right={`${filteredTickets.length} ${filteredTickets.length === 1 ? "ticket" : "tickets"} · click row to open in Zoho Desk`}
            >
              <TicketRows tickets={filteredTickets} />
            </Panel>
          </div>
        )}
      </div>
    </main>
  );
}
