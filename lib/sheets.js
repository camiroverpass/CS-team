const PTO_SHEET_ID = "1Rq2YgaysqVKGs7O9nlh-jNclDV16eqptbfX6xgbDuig";

export const PTO_PEOPLE = [
  { name: "Paula",     gid: "1246198592" },
  { name: "Francisca", gid: "1554346589" },
  { name: "Dani",      gid: "808696531"  },
  { name: "Cami",      gid: "456374230"  },
];

export function getPtoCsvUrl(gid) {
  return `https://docs.google.com/spreadsheets/d/${PTO_SHEET_ID}/export?format=csv&gid=${gid}`;
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
  return rows;
}

async function fetchSheetRows(gid) {
  const url = getPtoCsvUrl(gid);
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Sheet fetch failed (${res.status}). If this is a private sheet, share it with "Anyone with the link — Viewer".`
    );
  }
  const text = await res.text();
  if (text.trim().toLowerCase().startsWith("<!doctype html") || text.includes("<html")) {
    throw new Error(
      'Sheet returned HTML instead of CSV. Share it with "Anyone with the link — Viewer".'
    );
  }
  return parseCsv(text);
}

// Split each person's sheet into the three sections the layout has:
// left side (cols A-D) = PTO taken; right side (cols E+) = summary + holidays block.
function splitPersonSheet(rows) {
  const trim = (v) => (v ?? "").toString().trim();

  // Left table: Start Date | End Date | Hours | Type
  const ptoRows = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const [s, e, h, t] = [trim(r[0]), trim(r[1]), trim(r[2]), trim(r[3])];
    if (!s && !e && !h && !t) continue;
    ptoRows.push({ startDate: s, endDate: e, hours: h, type: t });
  }

  // Right side: a flat list of label/value pairs from cols E-I so every non-empty
  // cell is shown. We skip rows that have nothing on the right.
  const summary = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const right = r.slice(4).map(trim);
    if (right.every((c) => !c)) continue;
    summary.push(right);
  }

  return { ptoRows, summary };
}

export async function fetchAllPtoData() {
  const results = await Promise.all(
    PTO_PEOPLE.map(async (p) => {
      try {
        const rows = await fetchSheetRows(p.gid);
        return { name: p.name, gid: p.gid, ...splitPersonSheet(rows), error: null };
      } catch (e) {
        return {
          name: p.name,
          gid: p.gid,
          ptoRows: [],
          summary: [],
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );
  return results;
}
