import Link from "next/link";
import { UPSELLS_TABS } from "@/lib/sheets.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BY_KEY = Object.fromEntries(UPSELLS_TABS.map((t) => [t.key, t]));

const CARDS = [
  {
    tab: BY_KEY["q4-2025"],
    description: "Deals closed in the fourth quarter of 2025.",
    accent: "from-slate-50 to-slate-100",
  },
  {
    tab: BY_KEY["q1-2026"],
    description: "Deals closed in the first quarter of 2026.",
    accent: "from-roverpass-50 to-white",
  },
  {
    tab: BY_KEY["q2-2026"],
    description: "Deals closed in the second quarter of 2026.",
    accent: "from-blue-50 to-white",
  },
  {
    tab: BY_KEY["commissions"],
    description: "Reference table of commission rates per product.",
    accent: "from-emerald-50 to-white",
  },
];

export default function UpsellsHubPage() {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upsells</h1>
        <p className="text-sm text-slate-500">
          Deals closed by the CS team, grouped by quarter. Commissions are paid
          at contract signing and again when the product goes live.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CARDS.map(({ tab, description, accent }) => (
          <Link
            key={tab.key}
            href={`/upsells/${tab.key}`}
            className={
              "group bg-gradient-to-br " + accent + " " +
              "rounded-xl border border-slate-200 p-6 shadow-sm " +
              "hover:shadow-md hover:border-roverpass-300 transition"
            }
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-roverpass-700">
                {tab.label}
              </h2>
              <span className="text-roverpass-500 group-hover:translate-x-1 transition">
                →
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
