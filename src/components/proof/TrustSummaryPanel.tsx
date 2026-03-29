import type { MockAsset, AssetVerdict } from "@/lib/mock/assets";

const VERDICT_CONFIG: Record<
  AssetVerdict,
  { label: string; description: string; className: string }
> = {
  Healthy: {
    label: "HEALTHY",
    description: "All disclosures verified and current.",
    className: "text-emerald-400 border-emerald-800 bg-emerald-950/50",
  },
  Review: {
    label: "REVIEW",
    description: "Some disclosures are expiring soon.",
    className: "text-amber-400 border-amber-800 bg-amber-950/50",
  },
  "At Risk": {
    label: "AT RISK",
    description: "Key disclosures missing or overdue.",
    className: "text-rose-400 border-rose-800 bg-rose-950/50",
  },
};

interface Props {
  asset: Pick<MockAsset, "verdict" | "attestations" | "lastUpdated">;
}

export function TrustSummaryPanel({ asset }: Props) {
  const config = VERDICT_CONFIG[asset.verdict];
  const verified = asset.attestations.filter((a) => a.status === "verified").length;
  const expiring = asset.attestations.filter((a) => a.status === "expiring").length;
  const stale = asset.attestations.filter((a) => a.status === "stale").length;
  const missing = asset.attestations.filter((a) => a.status === "missing").length;

  return (
    <div className={`rounded-xl border p-6 ${config.className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Verdict + description */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-black font-mono text-xl tracking-widest">{config.label}</span>
          </div>
          <p className="text-sm opacity-80">{config.description}</p>
        </div>

        {/* Attestation count summary */}
        <div className="shrink-0 flex gap-5 text-center text-sm font-mono">
          <CountPill value={verified} label="Verified" className="text-emerald-400" />
          <CountPill value={expiring} label="Expiring" className="text-amber-400" />
          <CountPill value={stale} label="Stale" className="text-orange-400" />
          <CountPill value={missing} label="Missing" className="text-rose-400" />
        </div>
      </div>

      <p className="mt-4 text-xs font-mono opacity-40">
        Updated {asset.lastUpdated}
      </p>
    </div>
  );
}

function CountPill({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className={`text-2xl font-black ${className}`}>{value}</p>
          <p className="text-xs opacity-60">{label}</p>
    </div>
  );
}
