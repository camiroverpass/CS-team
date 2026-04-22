const PTO_SHEET_ID = "1Rq2YgaysqVKGs7O9nlh-jNclDV16eqptbfX6xgbDuig";
const PTO_SHEET_GID = "808696531";

export function getPtoCsvUrl() {
  return `https://docs.google.com/spreadsheets/d/${PTO_SHEET_ID}/export?format=csv&gid=${PTO_SHEET_GID}`;
}

export function parseCsv(csv) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"') {
        if (csv[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((v) => v && v.trim().length));
}

export async function fetchPtoRows() {
  const url = getPtoCsvUrl();
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Sheet fetch failed (${res.status}). If this is a private sheet, share it with "Anyone with the link — Viewer" or switch to service-account auth.`
    );
  }
  const text = await res.text();
  if (text.trim().toLowerCase().startsWith("<!doctype html") || text.includes("<html")) {
    throw new Error(
      "Sheet returned HTML instead of CSV. The sheet is likely private — share it with \"Anyone with the link — Viewer\" or switch to service-account auth."
    );
  }
  const rows = parseCsv(text);
  if (rows.length === 0) return { headers: [], data: [] };
  const [headers, ...data] = rows;
  return { headers, data };
}
