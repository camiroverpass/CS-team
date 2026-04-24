const PTO_SHEET_ID = "1Rq2YgaysqVKGs7O9nlh-jNclDV16eqptbfX6xgbDuig";
const UPSELLS_SHEET_ID = "1YqhLLu1iqH6-ChcIavJW0Dh5P7QJaj3QcIrFk-16WoM";

export const UPSELLS_TABS = [
  { key: "q4-2025", label: "Oct-Dec 2025", gid: "500881899",  kind: "flat" },
  { key: "q1-2026", label: "Jan-Mar 2026", gid: "1512220293", kind: "by-rep" },
  { key: "q2-2026", label: "Apr-Jun 2026", gid: "556072506",  kind: "by-rep" },
  { key: "commissions", label: "Commissions", gid: "372058084", kind: "commissions" },
];

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

function splitPersonSheet(rows) {
  const trim = (v) => (v ?? "").toString().trim();

  const ptoRows = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const [s, e, h] = [trim(r[0]), trim(r[1]), trim(r[2])];
    if (!s && !e && !h) continue;
    ptoRows.push({ startDate: s, endDate: e, hours: h });
  }

  let summary = null;
  for (let i = 0; i < rows.length; i++) {
    const right = (rows[i] || []).slice(4).map(trim);
    const lower = right.map((c) => c.toLowerCase());
    const remainingIdx = lower.findIndex((c) => c.includes("remaining"));
    const issuedIdx = lower.findIndex((c) => /days\s*issued/.test(c));
    const leftIdx = lower.findIndex((c) => /days\s*left/.test(c));
    if (remainingIdx >= 0 && issuedIdx >= 0 && leftIdx >= 0) {
      const values = (rows[i + 1] || []).slice(4).map(trim);
      summary = {
        remaining: values[remainingIdx] || "",
        daysIssued: values[issuedIdx] || "",
        daysLeft: values[leftIdx] || "",
      };
      break;
    }
  }

  return { ptoRows, summary };
}

async function fetchSheetCsv(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${UPSELLS_SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Sheet fetch failed (${res.status}). Share it with "Anyone with the link — Viewer".`
    );
  }
  const text = await res.text();
  if (text.trim().toLowerCase().startsWith("<!doctype html") || text.includes("<html")) {
    throw new Error('Sheet returned HTML instead of CSV. Share it with "Anyone with the link — Viewer".');
  }
  return parseCsv(text);
}

function trimTrailingEmptyCols(headers, rows) {
  let lastCol = Math.max(headers.length, ...rows.map((r) => r.length)) - 1;
  while (lastCol >= 0) {
    const headerEmpty = !(headers[lastCol] ?? "").trim();
    const allEmpty = rows.every((r) => !((r[lastCol] ?? "").trim()));
    if (headerEmpty && allEmpty) lastCol--;
    else break;
  }
  return {
    headers: headers.slice(0, lastCol + 1),
    rows: rows.map((r) => r.slice(0, lastCol + 1)).filter((r) => r.some((v) => (v ?? "").trim())),
  };
}

// Oct-Dec 2025 layout: flat table. The sheet has a commission-reference table
// embedded on the right (cols 8+) that we drop. Only keep the labeled columns
// (Campground, Product, Deal, Date signed, Go Live Date, Rep) plus 2 unlabeled
// cols we expose as Value and Notes. Filter rows that aren't real deals
// (must have both Campground and Product).
function parseFlat(rows) {
  if (rows.length === 0) return { headers: [], data: [] };
  const headers = [
    "Campground",
    "Product",
    "Deal",
    "Date signed",
    "Go Live Date",
    "Rep",
    "Value",
    "Notes",
  ];
  const data = rows.slice(1).reduce((acc, r) => {
    const campground = (r[0] ?? "").trim();
    const product = (r[1] ?? "").trim();
    if (!campground || !product) return acc;
    acc.push(headers.map((_, i) => (r[i] ?? "").trim()));
    return acc;
  }, []);
  return { headers, rows: data };
}

// Jan-Mar / Apr-Jun layout: sections grouped by rep.
// A new section starts with a row whose only non-empty cell is an all-caps rep label.
// Next non-empty row is the column header. Then deal rows until a row containing "TOTAL"
// (per-rep total) or an empty row. Bottom may contain "TOTAL COMM CS".
function parseByRep(rows) {
  const sections = [];
  let grandTotal = null;
  let i = 0;

  const nonEmpty = (r) => (r || []).some((c) => (c ?? "").trim());
  const looksLikeRepHeader = (r) => {
    const nonEmptyCells = (r || []).map((c) => (c ?? "").trim()).filter(Boolean);
    if (nonEmptyCells.length !== 1) return false;
    const v = nonEmptyCells[0];
    // rep names are short all-caps labels without numbers or $ (e.g., "CAMI L", "FRAN", "DANI", "CAMI F")
    return /^[A-Z][A-Z ]{0,15}$/.test(v) && !/TOTAL/i.test(v);
  };
  const looksLikeColumnHeader = (r) => {
    const t = (r || []).map((c) => (c ?? "").trim().toLowerCase());
    return t.includes("campground") && t.includes("product");
  };
  const totalRowAmount = (r) => {
    const cells = (r || []).map((c) => (c ?? "").trim());
    const idx = cells.findIndex((c) => /^total/i.test(c));
    if (idx < 0) return null;
    // the amount is the next non-empty cell after "TOTAL"
    for (let j = idx + 1; j < cells.length; j++) {
      if (cells[j]) return { label: cells[idx], amount: cells[j] };
    }
    return { label: cells[idx], amount: "" };
  };

  while (i < rows.length) {
    const r = rows[i];
    if (!nonEmpty(r)) { i++; continue; }

    // Bottom grand total ("TOTAL COMM CS") — capture and continue scanning
    const t = totalRowAmount(r);
    if (t && /COMM/i.test(t.label)) {
      grandTotal = { label: t.label, amount: t.amount };
      i++;
      continue;
    }

    if (looksLikeRepHeader(r)) {
      const repName = r.find((c) => (c ?? "").trim()).trim();
      i++;
      // Find the next column-header row
      while (i < rows.length && !looksLikeColumnHeader(rows[i])) i++;
      if (i >= rows.length) break;
      const colHeaders = rows[i].map((c) => (c ?? "").trim());
      i++;

      // Collect deal rows until empty row or per-rep TOTAL
      const deals = [];
      let repTotal = null;
      while (i < rows.length) {
        const row = rows[i];
        if (!nonEmpty(row)) { i++; break; }
        const tr = totalRowAmount(row);
        if (tr && !/COMM/i.test(tr.label)) { repTotal = tr; i++; break; }
        if (looksLikeRepHeader(row)) break; // next section starts, don't consume
        deals.push(row.map((c) => (c ?? "").trim()));
        i++;
      }

      sections.push({ rep: repName, headers: colHeaders, deals, total: repTotal });
      continue;
    }

    i++;
  }

  return { sections, grandTotal };
}

// Commission table: simple flat reference table
function parseCommissions(rows) {
  if (rows.length === 0) return { headers: [], data: [] };
  const [raw, ...rest] = rows;
  return trimTrailingEmptyCols(raw, rest);
}

export async function fetchUpsellTab(key) {
  const tab = UPSELLS_TABS.find((t) => t.key === key);
  if (!tab) throw new Error(`Unknown upsell tab: ${key}`);
  try {
    const rows = await fetchSheetCsv(tab.gid);
    let parsed;
    if (tab.kind === "by-rep") parsed = parseByRep(rows);
    else if (tab.kind === "commissions") parsed = parseCommissions(rows);
    else parsed = parseFlat(rows);
    return { ...tab, ...parsed, error: null };
  } catch (e) {
    return { ...tab, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchAllUpsellsData() {
  const tabs = await Promise.all(
    UPSELLS_TABS.map(async (tab) => {
      try {
        const rows = await fetchSheetCsv(tab.gid);
        let parsed;
        if (tab.kind === "by-rep") parsed = parseByRep(rows);
        else if (tab.kind === "commissions") parsed = parseCommissions(rows);
        else parsed = parseFlat(rows);
        return { ...tab, ...parsed, error: null };
      } catch (e) {
        return { ...tab, error: e instanceof Error ? e.message : String(e) };
      }
    })
  );
  return tabs;
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
          summary: null,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );
  return results;
}
