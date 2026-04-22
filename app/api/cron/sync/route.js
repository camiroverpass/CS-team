import { NextResponse } from "next/server";
import { fetchTicketsSince } from "../../../../lib/zoho-desk.js";
import { supabaseAdmin } from "../../../../lib/supabase.js";

export const runtime = "nodejs";
export const maxDuration = 300;

function mapTicket(t) {
  const problem = t.cf?.cf_problem || t.cf?.problem || null;
  const created = t.createdTime || null;
  const closed = t.closedTime || null;
  const close_hours =
    created && closed
      ? (new Date(closed).getTime() - new Date(created).getTime()) / 36e5
      : null;

  return {
    id: String(t.id),
    ticket_number: t.ticketNumber || null,
    subject: t.subject || null,
    status: t.status || null,
    problem,
    department_id: t.departmentId || null,
    contact_id: t.contactId || null,
    channel: t.channel || null,
    priority: t.priority || null,
    created_time: created,
    modified_time: t.modifiedTime || null,
    closed_time: closed,
    close_hours,
    raw: t,
    synced_at: new Date().toISOString(),
  };
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: state } = await supabase
    .from("sync_state")
    .select("value")
    .eq("key", "last_modified_time")
    .maybeSingle();

  const sinceIso = state?.value || null;

  const tickets = await fetchTicketsSince(sinceIso);
  if (tickets.length === 0) {
    return NextResponse.json({ synced: 0, since: sinceIso });
  }

  const rows = tickets.map(mapTicket);
  const { error } = await supabase.from("tickets").upsert(rows, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const newest = rows.reduce((max, r) => {
    if (!r.modified_time) return max;
    return !max || r.modified_time > max ? r.modified_time : max;
  }, null);

  if (newest) {
    await supabase
      .from("sync_state")
      .upsert({ key: "last_modified_time", value: newest, updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ synced: rows.length, since: sinceIso, newest });
}
