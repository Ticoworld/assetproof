import type { ProofRecord, TrustState } from "@/lib/proof/model";

const VERDICT_CONFIG: Record<
  TrustState,
  { label: string; description: string; className: string }
> = {
  Healthy: {
    label: "HEALTHY",
    description: "All disclosures verified and current.",
    className: "text-emerald-400 border-emerald-800 bg-emerald-950/50",
  },
  Review: {
    label: "REVIEW",
    description: "One or more disclosures are expiring soon.",
    className: "text-amber-400 border-amber-800 bg-amber-950/50",
  },
  "At Risk": {
    label: "AT RISK",
    description: "Key disclosures are missing or overdue.",
    className: "text-rose-400 border-rose-800 bg-rose-950/50",
  },
};

interface Props {
  record: Pick<ProofRecord, "summary" | "asOf">;
}

export function TrustSummaryPanel({ record }: Props) {
  const config = VERDICT_CONFIG[record.summary.trust];
  const { verifiedCount, expiringCount, staleCount, missingCount } = record.summary;

  return (
    <div className={`rounded-xl border p-6 ${config.className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Verdict + description */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-black font-mono text-xl tracking-widest">{config.label}</span>
          </div>
          <p className="text-sm opacity-80">{record.summary.explanation || config.description}</p>
        </div>

        {/* Pre-computed signal counts from summary */}
        <div className="shrink-0 flex gap-5 text-center text-sm font-mono">
          <CountPill value={verifiedCount} label="Verified" className="text-emerald-400" />
          <CountPill value={expiringCount} label="Expiring" className="text-amber-400" />
          <CountPill value={staleCount} label="Stale" className="text-orange-400" />
          <CountPill value={missingCount} label="Missing" className="text-rose-400" />
        </div>
      </div>

      <p className="mt-4 text-xs font-mono opacity-40">
        As of {record.asOf}
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
