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
  .select("id, raw")
  .order("created_time", { ascending: false })
  .limit(1);

const raw = data?.[0]?.raw;
console.log("All top-level keys:");
console.log(Object.keys(raw || {}).sort());
console.log("\nKeys containing 'layout' (case-insensitive):");
for (const k of Object.keys(raw || {})) {
  if (/layout/i.test(k)) console.log(`  ${k} = ${JSON.stringify(raw[k])}`);
}
console.log("\nKeys containing 'web' or 'url':");
for (const k of Object.keys(raw || {})) {
  if (/web|url/i.test(k)) console.log(`  ${k} = ${JSON.stringify(raw[k])}`);
}
