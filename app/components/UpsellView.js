import Link from "next/link";

function isUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function Cell({ header, value }) {
  const v = (value ?? "").trim();
  if (!v) return <span className="text-slate-300">—</span>;
  const h = (header || "").toLowerCase();

  if ((h === "deal" || h === "deal or subscription") && isUrl(v)) {
    return (
      <a
        href={v}
        target="_blank"
        rel="noreferrer"
        className="text-roverpass-600 hover:text-roverpass-800 underline"
      >
        View deal
      </a>
    );
  }
  if (/^\$[\d,]/.test(v) || /^\$?\d[\d,]*\.\d{2}$/.test(v)) {
    return <span className="font-semibold text-slate-800">{v}</span>;
  }
  return <span className="text-slate-700">{v}</span>;
}

function GenericTable({ headers, data, emptyText = "No rows" }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600 border-b border-slate-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-4 font-semibold whitespace-nowrap">
                {h || " "}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              {headers.map((h, j) => (
                <td key={j} className="py-2 px-4 align-top">
                  <Cell header={h} value={row[j]} />
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={headers.length || 1} className="py-8 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ByRepView({ sections, grandTotal }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-400 text-sm">
        No deals logged this quarter.
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {sections.map((s, i) => {
        const hasDeals = s.deals && s.deals.length > 0;
        return (
          <section key={i}>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                {s.rep}
              </h2>
              {s.total && (
                <div className="text-sm text-slate-500">
                  {s.total.label}:{" "}
                  <span className="font-semibold text-slate-900">{s.total.amount}</span>
                </div>
              )}
            </div>
            {hasDeals ? (
              <GenericTable headers={s.headers} data={s.deals} emptyText="No deals" />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-400 text-sm">
                No deals yet
              </div>
            )}
          </section>
        );
      })}

      {grandTotal && (
        <div className="bg-roverpass-50 border border-roverpass-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-roverpass-700">
            {grandTotal.label}
          </span>
          <span className="text-lg font-bold text-roverpass-700">
            {grandTotal.amount}
          </span>
        </div>
      )}
    </div>
  );
}

export default function UpsellView({ tab }) {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="mb-4">
        <Link
          href="/upsells"
          className="text-sm text-slate-500 hover:text-roverpass-600"
        >
          ← Back to Upsells
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{tab.label}</h1>
        {tab.kind === "commissions" && (
          <p className="text-sm text-slate-500 mt-1">
            Commission rates per product — paid at contract signing and when
            the product goes live.
          </p>
        )}
      </header>

      {tab.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 text-sm">
          <div className="font-semibold">Could not load {tab.label}</div>
          <div className="mt-1">{tab.error}</div>
        </div>
      )}

      {!tab.error && tab.kind === "by-rep" && (
        <ByRepView sections={tab.sections} grandTotal={tab.grandTotal} />
      )}

      {!tab.error && tab.kind === "flat" && (
        <>
          <div className="mb-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {(tab.rows ?? []).length}
            </span>{" "}
            deal{(tab.rows ?? []).length === 1 ? "" : "s"}
          </div>
          <GenericTable
            headers={tab.headers || []}
            data={tab.rows || []}
            emptyText="No deals logged this quarter"
          />
        </>
      )}

      {!tab.error && tab.kind === "commissions" && (
        <div className="max-w-2xl">
          <GenericTable
            headers={tab.headers || []}
            data={tab.rows || []}
            emptyText="No commission rates"
          />
        </div>
      )}
    </main>
  );
}
