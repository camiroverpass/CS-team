import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase.js";

export const runtime = "nodejs";

const ALLOWED_LAYOUT_IDS = new Set([
  "1177001000000074011", // Campground Tickets
  "1177001000000506883", // Camper Tickets
]);

function normalizeProblem(p) {
  if (!p) return null;
  const parts = String(p)
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !/^none$/i.test(s));
  if (parts.length === 0) return null;
  return parts.join("; ");
}

function parseRange(req) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") || new Date().toISOString();
  const fromParam = url.searchParams.get("from");
  const from = fromParam || new Date(Date.now() - 30 * 864e5).toISOString();
  const compare = url.searchParams.get("compare") === "1";
  return { from, to, compare };
}

function shiftOneYearBack(iso) {
  const d = new Date(iso);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString();
}

function shiftOneYearForward(iso) {
  const d = new Date(iso);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString();
}

async function fetchTickets(supabase, from, to) {
  const pageSize = 1000;
  let tickets = [];
  let offset = 0;
  while (true) {
    const { data: rows, error } = await supabase
      .from("tickets")
      .select(
        "id, status, problem, created_time, closed_time, close_hours, ticket_number, subject, url:raw->>webUrl, layoutId:raw->>layoutId, statusType:raw->>statusType"
      )
      .gte("created_time", from)
      .lte("created_time", to)
      .order("created_time", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) break;
    tickets = tickets.concat(rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
    if (offset > 50000) break;
  }
  return tickets
    .filter((t) => ALLOWED_LAYOUT_IDS.has(t.layoutId))
    .map((t) => ({ ...t, problem: normalizeProblem(t.problem) }));
}

function computeMetrics(tickets) {
  const isClosed = (t) => t.statusType === "Closed";
  const open = tickets.filter((t) => !isClosed(t));
  const closed = tickets.filter((t) => isClosed(t));

  const byProblemMap = new Map();
  for (const t of tickets) {
    const key = t.problem || "Unspecified";
    byProblemMap.set(key, (byProblemMap.get(key) || 0) + 1);
  }
  const byProblem = Array.from(byProblemMap.entries())
    .map(([problem, count]) => ({ problem, count }))
    .sort((a, b) => b.count - a.count);

  const closeHours = closed.map((t) => t.close_hours).filter((h) => h != null && h >= 0);
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

  return {
    totals: { total: tickets.length, open: open.length, closed: closed.length },
    byProblem,
    closeTime: { avg_hours: avgCloseHours, median_hours: medianCloseHours, series: closeTimeSeries },
    createdSeries,
    tickets,
  };
}

export async function GET(req) {
  const { from, to, compare } = parseRange(req);
  const supabase = supabaseAdmin();

  let currentTickets;
  try {
    currentTickets = await fetchTickets(supabase, from, to);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  const current = computeMetrics(currentTickets);

  let previous = null;
  if (compare) {
    const prevFrom = shiftOneYearBack(from);
    const prevTo = shiftOneYearBack(to);
    try {
      const prevTickets = await fetchTickets(supabase, prevFrom, prevTo);
      const p = computeMetrics(prevTickets);
      previous = {
        range: { from: prevFrom, to: prevTo },
        totals: p.totals,
        byProblem: p.byProblem,
        closeTime: { avg_hours: p.closeTime.avg_hours, median_hours: p.closeTime.median_hours },
        createdSeries: p.createdSeries.map((d) => ({ day: shiftOneYearForward(d.day).slice(0, 10), count: d.count })),
      };
    } catch (e) {
      // Comparison is best-effort; don't fail the main request.
      previous = { error: e.message };
    }
  }

  return NextResponse.json({
    range: { from, to },
    totals: current.totals,
    byProblem: current.byProblem,
    closeTime: current.closeTime,
    createdSeries: current.createdSeries,
    tickets: current.tickets.slice(0, 2000).map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      subject: t.subject,
      problem: t.problem,
      status: t.status,
      statusType: t.statusType,
      created_time: t.created_time,
      closed_time: t.closed_time,
      close_hours: t.close_hours,
      url: t.url,
    })),
    previous,
  });
}
