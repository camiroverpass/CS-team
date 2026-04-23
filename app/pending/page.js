export const dynamic = "force-dynamic";

export default function PendingPage() {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pending</h1>
        <p className="text-sm text-slate-500">Items waiting on the CS team.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-roverpass-50 flex items-center justify-center text-2xl">
          ⏳
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-800">Coming soon</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-slate-500">
          Once we decide what belongs here — pending onboardings, unfinished
          upsells, follow-ups, or something else — this tab will show them.
        </p>
      </div>
    </main>
  );
}
