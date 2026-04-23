import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { count, error: countErr } = await sb
  .from("tickets")
  .select("id", { count: "exact", head: true });
console.log("Total tickets in DB:", count, countErr?.message || "");

const { data: recent, error: recentErr } = await sb
  .from("tickets")
  .select("id, ticket_number, subject, status, created_time, layoutId:raw->>layoutId, webUrl:raw->>webUrl")
  .order("created_time", { ascending: false })
  .limit(5);
console.log("\nMost recent 5 tickets:");
console.log(recent || recentErr?.message);

const { data: oldest } = await sb
  .from("tickets")
  .select("created_time")
  .order("created_time", { ascending: true })
  .limit(1);
const { data: newest } = await sb
  .from("tickets")
  .select("created_time")
  .order("created_time", { ascending: false })
  .limit(1);
console.log("\nDate range in DB:");
console.log("  Oldest:", oldest?.[0]?.created_time);
console.log("  Newest:", newest?.[0]?.created_time);

const { data: sync } = await sb.from("sync_state").select("*");
console.log("\nSync state:", sync);

const { data: layouts } = await sb
  .from("tickets")
  .select("layoutId:raw->>layoutId")
  .limit(2000);
const layoutCounts = {};
for (const r of layouts || []) {
  const id = r.layoutId || "null";
  layoutCounts[id] = (layoutCounts[id] || 0) + 1;
}
console.log("\nLayout ID counts (from up to 2000 rows):");
for (const [id, n] of Object.entries(layoutCounts)) console.log(`  ${id}: ${n}`);
