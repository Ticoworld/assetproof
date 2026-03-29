import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo + Tagline */}
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-3xl font-mono font-black text-zinc-100 tracking-tight">
          ASSETPROOF
        </h1>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
          RWA Attestation &amp; Disclosure Monitor on BNB Chain
        </p>
      </div>

      {/* Action cards */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/proof/demo-asset"
          className="group bg-zinc-900 border border-zinc-800 hover:border-emerald-800 rounded-xl p-6 space-y-3 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-900 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-zinc-200 font-semibold text-sm group-hover:text-emerald-400 transition-colors">
              Verify Asset
            </h2>
            <p className="text-zinc-600 text-xs mt-0.5">
              View attestation and disclosure proof for a registered RWA.
            </p>
          </div>
          <span className="text-emerald-600 group-hover:text-emerald-400 font-mono text-xs transition-colors">
            View Demo &rarr;
          </span>
        </Link>

        <Link
          href="/issuer/new"
          className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-6 space-y-3 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <h2 className="text-zinc-200 font-semibold text-sm group-hover:text-zinc-100 transition-colors">
              Register Asset
            </h2>
            <p className="text-zinc-600 text-xs mt-0.5">
              Submit your tokenized RWA for on-chain attestation and disclosure monitoring.
            </p>
          </div>
          <span className="text-zinc-600 group-hover:text-zinc-400 font-mono text-xs transition-colors">
            Issuer Portal &rarr;
          </span>
        </Link>
      </div>

      {/* What we verify */}
      <div className="mt-12 w-full max-w-lg">
        <p className="text-zinc-700 font-mono text-[10px] uppercase tracking-widest text-center mb-4">
          What we monitor
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            "KYC / AML",
            "Asset Valuation",
            "Custody",
            "Legal Compliance",
            "Smart Contract Audit",
            "Insurance Coverage",
          ].map((item) => (
            <div
              key={item}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 px-3"
            >
              <p className="text-zinc-500 text-[10px] font-mono">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-zinc-800 text-[10px] font-mono">
          Powered by BNB Chain Attestation Service &bull; Gemini AI &bull; Phase 2
        </p>
      </div>
    </main>
  );
}
