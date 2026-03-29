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
    <div className="min-h-screen bg-[#09090b] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-zinc-600 hover:text-zinc-400 font-mono text-xs uppercase tracking-widest transition-colors"
          >
            &larr; AssetProof
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-700">Proof ID: {asset.id}</span>
            <Link
              href="/issuer/new"
              className="text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
            >
              Register Asset
            </Link>
          </div>
        </div>

        {/* Page heading */}
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">
            Asset Proof &mdash; {asset.name}
          </h1>
          <p className="text-zinc-600 text-xs font-mono mt-0.5">
            Public attestation and disclosure record on BNB Chain (mock data)
          </p>
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
                Attestations
              </h2>
              <span className="text-zinc-700 font-mono text-xs">
                {asset.attestations.length} records
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

        {/* Footer note */}
        <p className="text-zinc-800 font-mono text-[10px] text-center pb-4">
          AssetProof &bull; BNB Chain Attestation Service &bull; Mock Data &bull; Phase 2
        </p>
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
