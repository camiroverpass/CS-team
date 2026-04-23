import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getToken() {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_DESK_REFRESH_TOKEN,
    client_id: process.env.ZOHO_DESK_CLIENT_ID,
    client_secret: process.env.ZOHO_DESK_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
  const r = await fetch(`${process.env.ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`, {
    method: "POST",
    body: params,
  });
  return (await r.json()).access_token;
}

let token = await getToken();

async function fetchBatch(from, limit) {
  const qs = new URLSearchParams({
    from: String(from),
    limit: String(limit),
    sortBy: "-modifiedTime",
    fields: "ticketNumber,subject,status,statusType,createdTime,modifiedTime,closedTime,departmentId,contactId,channel,priority,cf_problem,layoutId,webUrl",
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`${process.env.ZOHO_DESK_API_DOMAIN}/tickets?${qs}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        orgId: process.env.ZOHO_DESK_ORG_ID,
      },
    });
    if (res.status === 204) return [];
    const text = await res.text();
    if (!text) return [];
    let json;
    try { json = JSON.parse(text); } catch { throw new Error(text.slice(0, 200)); }
    const rateLimited = res.status === 429 || json.errorCode === "RATE_LIMIT_EXCEEDED";
    if (rateLimited && attempt < 5) {
      const wait = Math.pow(2, attempt) * 10000;
      console.log(`  rate limited, waiting ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    return json.data || [];
  }
  return [];
}

function mapTicket(t) {
  const problem = t.cf?.cf_problem || t.cf?.problem || null;
  const created = t.createdTime || null;
  const closed = t.closedTime || null;
  const close_hours = created && closed
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

const limit = 100;
let from = 1;
let total = 0;
let newestModified = null;
const allRows = [];

while (true) {
  const batch = await fetchBatch(from, limit);
  if (batch.length === 0) break;
  const rows = batch.map(mapTicket);
  allRows.push(...rows);
  for (const r of rows) {
    if (!newestModified || (r.modified_time && r.modified_time > newestModified)) {
      newestModified = r.modified_time;
    }
  }
  total += rows.length;
  process.stdout.write(`\rFetched ${total}`);
  if (batch.length < limit) break;
  from += limit;
  if (from > 100000) break;
}
console.log(`\nFetched ${total} tickets total. Upserting in batches of 500...`);

const batchSize = 500;
for (let i = 0; i < allRows.length; i += batchSize) {
  const slice = allRows.slice(i, i + batchSize);
  const { error } = await sb.from("tickets").upsert(slice, { onConflict: "id" });
  if (error) {
    console.error("Upsert error at batch", i / batchSize, ":", error.message);
    process.exit(1);
  }
  process.stdout.write(`\rUpserted ${Math.min(i + batchSize, allRows.length)}/${allRows.length}`);
}

console.log("\n\nUpdating sync_state...");
await sb.from("sync_state").upsert({
  key: "last_modified_time",
  value: newestModified,
  updated_at: new Date().toISOString(),
});

console.log("Done. Newest modified:", newestModified);
