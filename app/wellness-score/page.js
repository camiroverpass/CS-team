export const dynamic = "force-dynamic";

export default function WellnessScorePage() {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Customer Wellness Score</h1>
        <p className="text-sm text-slate-500">Early warning signals for at-risk customers.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-roverpass-50 flex items-center justify-center text-2xl">
          🚧
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-800">Coming soon</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-slate-500">
          The wellness score model is still being built. Once the inputs and
          scoring logic are defined, each customer&apos;s score — plus trend and
          contributing factors — will show up here.
        </p>
      </div>
    </main>
  );
}
