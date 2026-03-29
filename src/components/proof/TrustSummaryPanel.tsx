import type { MockAsset, AssetVerdict } from "@/lib/mock/assets";

const VERDICT_CONFIG: Record<
  AssetVerdict,
  { label: string; description: string; className: string; barClass: string; ringClass: string }
> = {
  Pass: {
    label: "PASS",
    description: "This asset meets current attestation and disclosure requirements.",
    className: "text-emerald-400 border-emerald-800 bg-emerald-950/50",
    barClass: "bg-emerald-500",
    ringClass: "ring-emerald-900",
  },
  Review: {
    label: "REVIEW",
    description: "One or more attestations require attention. Proceed with caution.",
    className: "text-amber-400 border-amber-800 bg-amber-950/50",
    barClass: "bg-amber-500",
    ringClass: "ring-amber-900",
  },
  Fail: {
    label: "FAIL",
    description: "Critical attestations are missing or overdue. Further due diligence required.",
    className: "text-rose-400 border-rose-800 bg-rose-950/50",
    barClass: "bg-rose-500",
    ringClass: "ring-rose-900",
  },
};

interface Props {
  asset: Pick<MockAsset, "verdict" | "trustScore" | "attestations" | "lastUpdated">;
}

export function TrustSummaryPanel({ asset }: Props) {
  const config = VERDICT_CONFIG[asset.verdict];
  const verified = asset.attestations.filter((a) => a.status === "verified").length;
  const stale = asset.attestations.filter((a) => a.status === "stale").length;
  const missing = asset.attestations.filter((a) => a.status === "missing").length;
  const total = asset.attestations.length;

  return (
    <div className={`rounded-xl border p-6 ${config.className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Score */}
        <div className={`shrink-0 w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center ring-4 ${config.ringClass} border-current`}>
          <span className="text-2xl font-black font-mono">{asset.trustScore}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">Trust</span>
        </div>

        {/* Verdict + description */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-black font-mono text-xl tracking-widest">{config.label}</span>
            <span className="text-xs font-mono opacity-60 uppercase tracking-widest">
              Attestation Summary
            </span>
          </div>
          <p className="text-sm opacity-80">{config.description}</p>

          {/* Trust bar */}
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full max-w-xs">
            <div
              className={`h-full rounded-full ${config.barClass}`}
              style={{ width: `${asset.trustScore}%` }}
            />
          </div>
        </div>

        {/* Attestation count summary */}
        <div className="shrink-0 flex gap-5 text-center text-sm font-mono">
          <CountPill value={verified} label="Verified" className="text-emerald-400" />
          <CountPill value={stale} label="Stale" className="text-amber-400" />
          <CountPill value={missing} label="Missing" className="text-rose-400" />
          <CountPill value={total} label="Total" className="opacity-50" />
        </div>
      </div>

      <p className="mt-4 text-xs font-mono opacity-40 uppercase tracking-widest">
        Last updated {asset.lastUpdated} &middot; Powered by AssetProof on BNB Chain
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
      <p className="text-[10px] uppercase tracking-widest opacity-60">{label}</p>
    </div>
  );
}
