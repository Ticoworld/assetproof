import { notFound } from "next/navigation";
import Link from "next/link";
import { getProofRecord } from "@/lib/proof/scenarios";
import { AssetOverviewCard } from "@/components/proof/AssetOverviewCard";
import { AttestationStatusCard } from "@/components/proof/AttestationStatusCard";
import { DisclosureTable } from "@/components/proof/DisclosureTable";
import { TrustSummaryPanel } from "@/components/proof/TrustSummaryPanel";

interface Props {
  params: Promise<{ assetId: string }>;
}

export default async function ProofPage({ params }: Props) {
  const { assetId } = await params;
  const record = getProofRecord(assetId);

  if (!record) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-zinc-200 tracking-tight text-sm">ASSETPROOF</Link>
        <Link href="/issuer/new" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">New asset &rarr;</Link>
      </header>
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">

        {/* Page heading */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-100">{record.assetName}</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs">{record.symbol}</span>
        </div>

        {/* Trust summary - full width banner */}
        <TrustSummaryPanel record={record} />

        {/* Two-column: overview + signals */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Overview card - narrower column */}
          <div className="lg:col-span-2">
            <AssetOverviewCard record={record} />
          </div>

          {/* Signal cards - wider column */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-widest">
                Disclosure signals
              </h2>
              <span className="text-zinc-600 font-mono text-xs">
                {record.signals.length} signals
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {record.signals.map((signal) => (
                <AttestationStatusCard key={signal.key} signal={signal} />
              ))}
            </div>
          </div>
        </div>

        {/* Disclosure documents - full width */}
        <DisclosureTable documents={record.documents} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { assetId } = await params;
  const record = getProofRecord(assetId);
  if (!record) return { title: "Asset Not Found | AssetProof" };
  return {
    title: `${record.assetName} (${record.symbol}) | AssetProof`,
    description: `Disclosure freshness and trust status for ${record.assetName} on BNB Chain.`,
  };
}
