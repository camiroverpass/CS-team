import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(".env.local", "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Distinct problem values, sorted by freq
const { data } = await sb
  .from("tickets")
  .select("problem")
  .limit(5000);

const counts = {};
for (const r of data || []) counts[r.problem || "NULL"] = (counts[r.problem || "NULL"] || 0) + 1;
console.log("Top 30 distinct 'problem' values:");
for (const [p, n] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${n.toString().padStart(5)}  ${JSON.stringify(p)}`);
}

// Find ones containing 'none'
console.log("\nValues containing 'none' (case-insensitive):");
for (const [p, n] of Object.entries(counts)) {
  if (/none/i.test(p)) console.log(`  ${n}  ${JSON.stringify(p)}`);
}

// Check raw.cf for a few tickets with multi-value-looking problem
console.log("\nSample raw.cf for tickets with comma/semicolon in problem:");
const { data: samples } = await sb
  .from("tickets")
  .select("id, problem, raw")
  .or("problem.ilike.%,%,problem.ilike.%;%,problem.ilike.%none%")
  .limit(5);
for (const t of samples || []) {
  console.log(`\n--- ticket ${t.id} ---`);
  console.log("  problem column:", JSON.stringify(t.problem));
  console.log("  raw.cf:", JSON.stringify(t.raw?.cf));
}
