import type { ProofRecord } from "@/lib/proof/model";

const CATEGORY_LABELS: Record<string, string> = {
  "real-estate": "Real Estate",
  commodities: "Commodities",
  treasury: "Treasury / Gov. Bonds",
  "private-credit": "Private Credit",
  infrastructure: "Infrastructure",
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSupply(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

interface Props {
  record: ProofRecord;
}

export function AssetOverviewCard({ record }: Props) {
  const statusColor =
    record.assetStatus === "active"
      ? "text-emerald-400"
      : record.assetStatus === "pending"
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">{record.assetName}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs">
              {record.symbol}
            </span>
          </div>
          <p className="text-zinc-500 text-xs font-mono">
            {record.walletAddress.slice(0, 10)}&hellip;{record.walletAddress.slice(-8)}
          </p>
        </div>
        <span className={`text-xs font-mono uppercase tracking-widest ${statusColor}`}>
          {record.assetStatus}
        </span>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <Field label="Category" value={CATEGORY_LABELS[record.category] ?? record.category} />
        <Field label="Jurisdiction" value={record.jurisdiction} />
        <Field label="Issuer" value={record.issuer} />
        <Field label="Custody Provider" value={record.custodyProvider} />
        <Field label="Total Value (USD)" value={formatUsd(record.totalValueUsd)} highlight />
        <Field label="Token Supply" value={formatSupply(record.tokenSupply)} />
        <Field label="Registered" value={record.createdAt} />
        <Field label="As Of" value={record.asOf} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-zinc-400 text-xs">{label}</p>
      <p className={highlight ? "text-emerald-400 font-semibold" : "text-zinc-200"}>{value}</p>
    </div>
  );
}
