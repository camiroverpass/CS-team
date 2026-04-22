import { fetchAllPtoData } from "@/lib/sheets.js";
import PtoTabs from "../components/PtoTabs.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PtosPage() {
  const people = await fetchAllPtoData();

  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">PTOs</h1>
        <p className="text-sm text-slate-500">
          Team time off — synced from the shared Google Sheet. Select a person to view their tab.
        </p>
      </header>

      <PtoTabs people={people} />
    </main>
  );
}
