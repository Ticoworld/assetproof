import { notFound } from "next/navigation";
import Link from "next/link";
import { getMockAsset } from "@/lib/mock/assets";
import { AssetOverviewCard } from "@/components/proof/AssetOverviewCard";
import { AttestationStatusCard } from "@/components/proof/AttestationStatusCard";
import { DisclosureTable } from "@/components/proof/DisclosureTable";
import { TrustSummaryPanel } from "@/components/proof/TrustSummaryPanel";

interface Props {
  params: Promise<{ assetId: string }>;
}

export default async function ProofPage({ params }: Props) {
  const { assetId } = await params;
  const asset = getMockAsset(assetId);

  if (!asset) {
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
          <h1 className="text-xl font-bold text-zinc-100">{asset.name}</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs">{asset.symbol}</span>
        </div>

        {/* Trust summary - full width banner */}
        <TrustSummaryPanel asset={asset} />

        {/* Two-column: overview + attestations */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Overview card - narrower column */}
          <div className="lg:col-span-2">
            <AssetOverviewCard asset={asset} />
          </div>

          {/* Attestations grid - wider column */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-widest">
                Status
              </h2>
              <span className="text-zinc-600 font-mono text-xs">
                {asset.attestations.length} signals
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {asset.attestations.map((att) => (
                <AttestationStatusCard key={att.id} attestation={att} />
              ))}
            </div>
          </div>
        </div>

        {/* Disclosure documents - full width */}
        <DisclosureTable disclosures={asset.disclosures} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { assetId } = await params;
  const asset = getMockAsset(assetId);
  if (!asset) return { title: "Asset Not Found | AssetProof" };
  return {
    title: `${asset.name} (${asset.symbol}) | AssetProof`,
    description: `Attestation and disclosure proof for ${asset.name} on BNB Chain.`,
  };
}
