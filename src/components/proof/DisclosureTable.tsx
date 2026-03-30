import type { ProofDocument, ProofStatus, SignalKey } from "@/lib/proof/model";
import { Check, AlertCircle } from "lucide-react";

const SIGNAL_LABELS: Record<SignalKey, string> = {
  custody: "Custody",
  valuation: "Valuation",
  legal: "Legal",
  regulatory: "Regulatory",
};

const STATUS_CONFIG: Record<
  ProofStatus,
  { label: string; className: string }
> = {
  verified: { label: "Verified", className: "text-emerald-400 bg-emerald-950/50 border-emerald-900" },
  expiring: { label: "Expiring", className: "text-amber-400 bg-amber-950/50 border-amber-900" },
  stale: { label: "Stale", className: "text-orange-400 bg-orange-950/50 border-orange-900" },
  missing: { label: "Missing", className: "text-rose-400 bg-rose-950/50 border-rose-900" },
};

interface Props {
  documents: ProofDocument[];
}

export function DisclosureTable({ documents }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h3 className="text-zinc-300 font-semibold text-sm">Disclosure documents</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-6 py-3 text-zinc-500 text-xs">Document</th>
            <th className="text-left px-4 py-3 text-zinc-500 text-xs">Signal</th>
            <th className="text-left px-4 py-3 text-zinc-500 text-xs">Published</th>
            <th className="text-left px-4 py-3 text-zinc-500 text-xs">Status</th>
            <th className="text-right px-6 py-3 text-zinc-500 text-xs">Link</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, i) => {
            const statusCfg = STATUS_CONFIG[doc.status];
            return (
              <tr
                key={doc.id}
                className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "" : "bg-zinc-800/20"}`}
              >
                <td className="px-6 py-3 text-zinc-200">{doc.title}</td>
                <td className="px-4 py-3">
                  <span className="text-zinc-500 font-mono text-xs">
                    {SIGNAL_LABELS[doc.signal]}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                  {doc.publishedAt || <span className="text-zinc-700">-</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono ${statusCfg.className}`}
                  >
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  {doc.url ? (
                    <div className="flex flex-col items-end gap-1">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 font-mono text-xs hover:text-zinc-200 transition-colors"
                      >
                        View ↗
                      </a>
                      {doc.credibility && (
                        <div>
                          {doc.credibility.reachable ? (
                            <span className="text-emerald-500/80 text-[10px] font-mono flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              Reachable
                              {doc.credibility.fileHint && ` (${doc.credibility.fileHint.toUpperCase()})`}
                            </span>
                          ) : (
                            <span className="text-amber-500/80 text-[10px] font-mono flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              {doc.credibility.protocol === "http" || doc.credibility.protocol === "other"
                                ? "Unsecure protocol"
                                : "Unreachable"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-700 font-mono text-xs">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
