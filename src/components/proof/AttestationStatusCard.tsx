import type { MockAttestation, AttestationStatus } from "@/lib/mock/assets";

const STATUS_CONFIG: Record<
  AttestationStatus,
  { label: string; dotClass: string; textClass: string; borderClass: string; bgClass: string }
> = {
  verified: {
    label: "Verified",
    dotClass: "bg-emerald-400",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-900",
    bgClass: "bg-emerald-950/40",
  },
  stale: {
    label: "Expiring Soon",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    borderClass: "border-amber-900",
    bgClass: "bg-amber-950/40",
  },
  missing: {
    label: "Overdue",
    dotClass: "bg-rose-400",
    textClass: "text-rose-400",
    borderClass: "border-rose-900",
    bgClass: "bg-rose-950/40",
  },
};

interface Props {
  attestation: MockAttestation;
}

export function AttestationStatusCard({ attestation }: Props) {
  const config = STATUS_CONFIG[attestation.status];

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${config.borderClass} ${config.bgClass}`}
    >
      {/* Type + status dot */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-zinc-200 font-medium text-sm leading-snug">{attestation.type}</p>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
          <span className={`text-xs font-mono ${config.textClass}`}>{config.label}</span>
        </div>
      </div>

      {/* Attester */}
      <div className="space-y-0.5">
        <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Attester</p>
        <p className="text-zinc-400 text-xs">{attestation.attester}</p>
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-xs">
        {attestation.attestedAt && (
          <div className="space-y-0.5">
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Issued</p>
            <p className="text-zinc-400 font-mono">{attestation.attestedAt}</p>
          </div>
        )}
        {attestation.expiresAt && (
          <div className="space-y-0.5">
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Expires</p>
            <p className={`font-mono ${attestation.status !== "verified" ? config.textClass : "text-zinc-400"}`}>
              {attestation.expiresAt}
            </p>
          </div>
        )}
      </div>

      {/* Schema ID */}
      <p className="text-zinc-700 font-mono text-[10px]">Schema {attestation.schemaId}</p>
    </div>
  );
}
