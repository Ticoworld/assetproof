"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadDraft, clearDraft } from "@/lib/draft/state";
import type { ProofRecord } from "@/lib/proof/model";
import { AssetOverviewCard } from "@/components/proof/AssetOverviewCard";
import { AttestationStatusCard } from "@/components/proof/AttestationStatusCard";
import { DisclosureTable } from "@/components/proof/DisclosureTable";
import { TrustSummaryPanel } from "@/components/proof/TrustSummaryPanel";

export default function ProofPreviewPage() {
  const [record, setRecord] = useState<ProofRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    setRecord(draft);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-zinc-700 font-mono text-xs uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <h2 className="text-zinc-300 font-semibold">No Draft Found</h2>
          <p className="text-zinc-600 text-sm">
            This preview requires a submitted registration. Start from the issuer portal.
          </p>
        </div>
        <Link
          href="/issuer/new"
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-sm font-mono hover:bg-zinc-700 transition-colors"
        >
          New asset
        </Link>
      </div>
    );
  }

  const handleReset = () => {
    clearDraft();
    window.location.href = "/issuer/new";
  };

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-zinc-200 tracking-tight text-sm">ASSETPROOF</Link>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-950 border border-amber-900 text-amber-400 font-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Preview
          </span>
          <button
            onClick={handleReset}
            className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
          >
            Edit &rarr;
          </button>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">

        {/* Heading */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-100">{record.assetName}</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs">{record.symbol}</span>
        </div>

        {/* Trust summary */}
        <TrustSummaryPanel record={record} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <AssetOverviewCard record={record} />
          </div>
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

        {/* Disclosure table */}
        <DisclosureTable documents={record.documents} />


        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-zinc-300 font-semibold text-sm">Submit for on-chain attestation</p>
          <div className="flex gap-3 shrink-0">
            <button
              disabled
              className="px-5 py-2.5 bg-zinc-100 text-zinc-900 rounded-lg font-semibold text-sm opacity-40 cursor-not-allowed"
            >
              Submit to chain
            </button>
            <Link
              href="/proof/at-risk"
              className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 font-mono text-sm hover:bg-zinc-700 transition-colors"
            >
              View demo
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
