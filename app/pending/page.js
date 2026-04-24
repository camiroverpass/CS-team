"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "ok", label: "All good" },
  { key: "missing_google_listing", label: "No Google listing" },
  { key: "missing_website_in_listing", label: "No website on listing" },
  { key: "missing_book_now_button", label: "No Book Now button" },
  { key: "wrong_link", label: "Wrong link" },
  { key: "error", label: "Error" },
];

const CORAL = "#F16A6A";
const CORAL_SOFT = "#FEE5E5";
const GREEN = "#15803D";
const GREEN_SOFT = "#DCFCE7";
const RED = "#B91C1C";
const RED_SOFT = "#FEE2E2";
const AMBER = "#B45309";
const AMBER_SOFT = "#FEF3C7";
const TEXT = "#101828";
const MUTED = "#667085";
const BORDER = "#EAECF0";

export default function BookingLinksPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [updated, setUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    fetch("/api/booking-links")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else { setRows(d.rows || []); setUpdated(new Date()); }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    c.all = rows.length;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter !== "all") out = out.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((r) => [r.name, r.city, r.email].some((v) => (v || "").toLowerCase().includes(q)));
    }
    return out;
  }, [rows, filter, query]);

  return (
    <main className="max-w-7xl mx-auto p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Booking links</h1>
          <p className="text-xs text-slate-500">
            RoverPass customers — health check of their public booking path.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {updated && (
            <span style={{ fontSize: 11, color: MUTED }}>
              Updated {formatAgo(updated)}
            </span>
          )}
          <button
            onClick={load}
            style={{
              padding: "4px 10px",
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              background: "#fff",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
              color: TEXT,
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      <div style={cardStyle}>
        <div style={{ padding: "10px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${BORDER}` }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  border: `1px solid ${active ? CORAL : BORDER}`,
                  background: active ? CORAL : "#fff",
                  color: active ? "#fff" : TEXT,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {f.label}
                <span style={{ marginLeft: 5, opacity: active ? 0.85 : 0.55 }}>
                  {counts[f.key] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <input
            placeholder="Search name / city / email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "5px 10px",
              fontSize: 12,
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              outline: "none",
              color: TEXT,
            }}
          />
        </div>

        {loading && <div style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 12 }}>Loading…</div>}
        {error && <div style={{ padding: 16, color: RED, fontSize: 12 }}>Error: {error}</div>}

        {!loading && !error && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#FAFBFC" }}>
                  {["Campground", "City / State", "Email", "Google", "Listing Website", "Button", "RP Link", "Status", "Action"].map((h) => (
                    <th key={h} style={{ padding: "7px 10px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: MUTED, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.campground_id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.name}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: MUTED, whiteSpace: "nowrap" }}>{[r.city, r.state].filter(Boolean).join(", ")}</td>
                    <td style={tdStyle}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                    </td>
                    <td style={tdStyle}><Pill value={r.google_listing} /></td>
                    <td style={tdStyle}>
                      {r.website_url ? (
                        <a
                          href={r.website_url}
                          target="_blank"
                          rel="noreferrer"
                          title={r.website_url}
                          style={{ color: CORAL, fontSize: 11, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                        >
                          {r.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </a>
                      ) : (
                        <Pill value="No" />
                      )}
                    </td>
                    <td style={tdStyle}><Pill value={r.book_now_button} /></td>
                    <td style={tdStyle}><Pill value={r.roverpass_link} /></td>
                    <td style={tdStyle}>
                      <StatusBadge status={r.status} />
                      {r.notes && (
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes}>
                          {r.notes}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {r.status !== "ok" && (
                        <button
                          onClick={() => alert(`Email templates not wired yet — will draft for ${r.email}`)}
                          style={{
                            padding: "3px 8px",
                            fontSize: 11,
                            border: `1px solid ${BORDER}`,
                            borderRadius: 5,
                            background: "#fff",
                            cursor: "pointer",
                            color: TEXT,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Send email
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 32, textAlign: "center", color: MUTED, fontSize: 12 }}>No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function formatAgo(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function Pill({ value }) {
  const ok = value === "Yes";
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: ok ? GREEN_SOFT : RED_SOFT,
      color: ok ? GREEN : RED,
    }}>{value || "—"}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    ok: { label: "OK", bg: GREEN_SOFT, fg: GREEN },
    wrong_link: { label: "Wrong link", bg: CORAL_SOFT, fg: CORAL },
    missing_book_now_button: { label: "No button", bg: AMBER_SOFT, fg: AMBER },
    missing_google_listing: { label: "No listing", bg: AMBER_SOFT, fg: AMBER },
    missing_website_in_listing: { label: "No website", bg: AMBER_SOFT, fg: AMBER },
    error: { label: "Error", bg: RED_SOFT, fg: RED },
  };
  const m = map[status] || { label: status, bg: "#E5E7EB", fg: TEXT };
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 6,
      background: m.bg,
      color: m.fg,
    }}>{m.label}</span>
  );
}

const cardStyle = {
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
};

const tdStyle = {
  padding: "7px 10px",
  verticalAlign: "middle",
  color: TEXT,
  fontSize: 12,
  overflow: "hidden",
};
