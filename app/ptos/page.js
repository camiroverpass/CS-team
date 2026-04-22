import { fetchPtoRows, getPtoCsvUrl } from "@/lib/sheets.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function PageHeader() {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">PTOs</h1>
      <p className="text-sm text-slate-500">
        Team time off — synced from the shared Google Sheet.
      </p>
    </header>
  );
}

export default async function PtosPage() {
  let headers = [];
  let data = [];
  let error = null;
  try {
    const res = await fetchPtoRows();
    headers = res.headers;
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <PageHeader />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 text-sm">
          <div className="font-semibold">Could not load PTO sheet</div>
          <div className="mt-1">{error}</div>
          <a
            href={getPtoCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-roverpass-700 underline"
          >
            Open CSV URL
          </a>
        </div>
      )}

      {!error && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 border-b border-slate-200">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-2 px-4 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  {headers.map((_, j) => (
                    <td key={j} className="py-2 px-4 text-slate-700">
                      {row[j] ?? ""}
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
                    No rows in sheet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
