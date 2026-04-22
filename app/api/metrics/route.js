import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase.js";

export const runtime = "nodejs";

function parseRange(req) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") || new Date().toISOString();
  const fromParam = url.searchParams.get("from");
  const from = fromParam || new Date(Date.now() - 30 * 864e5).toISOString();
  return { from, to };
}

export async function GET(req) {
  const { from, to } = parseRange(req);
  const supabase = supabaseAdmin();

  const { data: rows, error } = await supabase
    .from("tickets")
    .select("id, status, problem, created_time, closed_time, close_hours, ticket_number, subject")
    .gte("created_time", from)
    .lte("created_time", to)
    .order("created_time", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tickets = rows || [];
  const isClosed = (s) => s && /closed/i.test(s);

  const open = tickets.filter((t) => !isClosed(t.status));
  const closed = tickets.filter((t) => isClosed(t.status));

  const byProblemMap = new Map();
  for (const t of tickets) {
    const key = t.problem || "Unspecified";
    byProblemMap.set(key, (byProblemMap.get(key) || 0) + 1);
  }
  const byProblem = Array.from(byProblemMap.entries())
    .map(([problem, count]) => ({ problem, count }))
    .sort((a, b) => b.count - a.count);

  const closeHours = closed
    .map((t) => t.close_hours)
    .filter((h) => h != null && h >= 0);
  const avgCloseHours = closeHours.length
    ? closeHours.reduce((s, h) => s + h, 0) / closeHours.length
    : null;
  const medianCloseHours = (() => {
    if (!closeHours.length) return null;
    const sorted = [...closeHours].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  })();

  const createdByDay = new Map();
  for (const t of tickets) {
    if (!t.created_time) continue;
    const day = t.created_time.slice(0, 10);
    createdByDay.set(day, (createdByDay.get(day) || 0) + 1);
  }
  const createdSeries = Array.from(createdByDay.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const closedByDay = new Map();
  for (const t of closed) {
    if (!t.closed_time || t.close_hours == null) continue;
    const day = t.closed_time.slice(0, 10);
    const current = closedByDay.get(day) || { total: 0, count: 0 };
    current.total += t.close_hours;
    current.count += 1;
    closedByDay.set(day, current);
  }
  const closeTimeSeries = Array.from(closedByDay.entries())
    .map(([day, { total, count }]) => ({ day, avg_hours: total / count, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return NextResponse.json({
    range: { from, to },
    totals: {
      total: tickets.length,
      open: open.length,
      closed: closed.length,
    },
    openTickets: open.slice(0, 100).map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      subject: t.subject,
      problem: t.problem,
      created_time: t.created_time,
    })),
    byProblem,
    closeTime: {
      avg_hours: avgCloseHours,
      median_hours: medianCloseHours,
      series: closeTimeSeries,
    },
    createdSeries,
  });
}
