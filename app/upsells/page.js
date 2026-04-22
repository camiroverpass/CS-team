import { fetchUpsellsRows } from "@/lib/sheets.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v.trim());
}

function Cell({ header, value }) {
  const v = (value ?? "").trim();
  if (!v) return <span className="text-slate-300">—</span>;

  // Render the "Deal" column (HubSpot URL) as a compact link
  if (header.toLowerCase() === "deal" && isUrl(v)) {
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

  // Highlight dollar amounts
  if (/^\$[\d,]/.test(v)) {
    return <span className="font-semibold text-slate-800">{v}</span>;
  }

  return <span className="text-slate-700">{v}</span>;
}

export default async function UpsellsPage() {
  let headers = [];
  let data = [];
  let error = null;
  try {
    const res = await fetchUpsellsRows();
    headers = res.headers;
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upsells</h1>
        <p className="text-sm text-slate-500">
          Deals closed by the CS team — synced from the shared Google Sheet.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 text-sm">
          <div className="font-semibold">Could not load Upsells sheet</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      {!error && (
        <>
          <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
            <div>
              <span className="font-semibold text-slate-900">{data.length}</span>{" "}
              deal{data.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600 border-b border-slate-200">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-2 px-4 font-semibold whitespace-nowrap">
                      {h || " "}
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
                    <td
                      colSpan={headers.length || 1}
                      className="py-8 text-center text-slate-400"
                    >
                      No upsells logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
