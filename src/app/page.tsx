import { TruthConsole } from "@/components/truth/TruthConsole";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 py-8">
      {/* Logo + Tagline */}
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-mono font-black text-zinc-100 tracking-tight">
          ASSETPROOF
        </h1>
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
          RWA Attestation &amp; Disclosure Monitor
        </p>
      </div>

      {/* Terminal */}
      <TruthConsole />

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-zinc-800 text-[10px] font-mono">
          Powered by Gemini Vision + BNB Chain
        </p>
      </div>
    </main>
  );
}
