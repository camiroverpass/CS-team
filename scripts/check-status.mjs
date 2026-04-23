import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await sb
  .from("tickets")
  .select("status, statusType:raw->>statusType")
  .limit(5000);

const statusCounts = {};
const typeCounts = {};
const pairs = {};
for (const r of data || []) {
  statusCounts[r.status || "null"] = (statusCounts[r.status || "null"] || 0) + 1;
  typeCounts[r.statusType || "null"] = (typeCounts[r.statusType || "null"] || 0) + 1;
  const pair = `${r.status}::${r.statusType}`;
  pairs[pair] = (pairs[pair] || 0) + 1;
}

console.log("Distinct status values:");
for (const [s, n] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s}: ${n}`);
}
console.log("\nDistinct statusType values:");
for (const [s, n] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s}: ${n}`);
}
console.log("\nstatus::statusType pairs:");
for (const [p, n] of Object.entries(pairs).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${p}: ${n}`);
}
