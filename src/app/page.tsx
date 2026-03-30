import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Top nav */}
      <header className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <span className="font-mono font-bold text-zinc-200 tracking-tight text-sm">ASSETPROOF</span>
        <Link
          href="/issuer/new"
          className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
        >
          New asset &rarr;
        </Link>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-8 pt-24 pb-16">
        <div className="max-w-2xl">
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4">
            BNB Chain &bull; Disclosure Attestations
          </p>
          <h1 className="text-4xl font-bold text-zinc-100 leading-tight mb-6">
            Trust requires ongoing proof.<br />Not just tokenization.
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-lg">
            AssetProof checks whether custody, valuation, and legal disclosures are current, expiring, stale, or missing, then publishes an attested trust receipt on BNB Chain.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/proof/at-risk"
              className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-semibold text-sm transition-colors"
            >
              View demo proof
            </Link>
            <Link
              href="/issuer/new"
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg font-semibold text-sm transition-colors"
            >
              Register an asset
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-zinc-600 text-xs">Other scenarios:</span>
            <Link href="/proof/review" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Review</Link>
            <span className="text-zinc-700 text-xs">&bull;</span>
            <Link href="/proof/healthy" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Healthy</Link>
          </div>
        </div>

        {/* What's tracked */}
        <div className="mt-24 border-t border-zinc-900 pt-12">
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-6">Disclosure signals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
            {[
              "Custody status",
              "Valuation freshness",
              "Legal filings",
              "Document completeness",
              "Trust status",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                <span className="text-zinc-400 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
