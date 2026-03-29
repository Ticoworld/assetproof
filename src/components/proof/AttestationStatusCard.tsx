import type { ProofSignal, ProofStatus } from "@/lib/proof/model";

const STATUS_CONFIG: Record<
  ProofStatus,
  { label: string; dotClass: string; textClass: string; borderClass: string; bgClass: string }
> = {
  verified: {
    label: "Verified",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-900",
    bgClass: "bg-emerald-950/40",
  },
  expiring: {
    label: "Expiring",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    borderClass: "border-amber-900",
    bgClass: "bg-amber-950/40",
  },
  stale: {
    label: "Stale",
    dotClass: "bg-orange-400",
    textClass: "text-orange-400",
    borderClass: "border-orange-900",
    bgClass: "bg-orange-950/40",
  },
  missing: {
    label: "Missing",
    dotClass: "bg-rose-400",
    textClass: "text-rose-400",
    borderClass: "border-rose-900",
    bgClass: "bg-rose-950/40",
  },
};

interface Props {
  signal: ProofSignal;
}

export function AttestationStatusCard({ signal }: Props) {
  const config = STATUS_CONFIG[signal.status];

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${config.borderClass} ${config.bgClass}`}
    >
      {/* Label + status dot */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-zinc-200 font-medium text-sm leading-snug">{signal.label}</p>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
          <span className={`text-xs font-mono ${config.textClass}`}>{config.label}</span>
        </div>
      </div>

      {/* Attester */}
      <div>
        <p className="text-zinc-400 text-xs">{signal.attester}</p>
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-xs">
        {signal.issuedAt && (
          <div className="space-y-0.5">
            <p className="text-zinc-500 text-[10px]">Issued</p>
            <p className="text-zinc-400 font-mono">{signal.issuedAt}</p>
          </div>
        )}
        {signal.expiresAt && (
          <div className="space-y-0.5">
            <p className="text-zinc-500 text-[10px]">Expires</p>
            <p className={`font-mono ${signal.status !== "verified" ? config.textClass : "text-zinc-400"}`}>
              {signal.expiresAt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
