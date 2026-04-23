import { fetchAllUpsellsData } from "@/lib/sheets.js";
import UpsellsTabs from "../components/UpsellsTabs.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UpsellsPage() {
  const tabs = await fetchAllUpsellsData();

  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Upsells</h1>
        <p className="text-sm text-slate-500">
          Deals closed by the CS team, grouped by quarter. Commissions are paid
          at contract signing and again when the product goes live.
        </p>
      </header>

      <UpsellsTabs tabs={tabs} />
    </main>
  );
}
