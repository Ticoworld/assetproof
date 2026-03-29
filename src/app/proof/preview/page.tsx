"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadDraft, clearDraft } from "@/lib/draft/state";
import type { ProofRecord } from "@/lib/proof/model";
import type { PublishResult } from "@/lib/proof/serializer";
import { AssetOverviewCard } from "@/components/proof/AssetOverviewCard";
import { AttestationStatusCard } from "@/components/proof/AttestationStatusCard";
import { DisclosureTable } from "@/components/proof/DisclosureTable";
import { TrustSummaryPanel } from "@/components/proof/TrustSummaryPanel";

type PublishPhase = "idle" | "publishing" | "done" | "error";

export default function ProofPreviewPage() {
  const [record, setRecord] = useState<ProofRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [publishPhase, setPublishPhase] = useState<PublishPhase>("idle");
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string>("");

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

  const handlePublish = async () => {
    if (!record || publishPhase === "publishing") return;
    setPublishPhase("publishing");
    setPublishResult(null);
    setPublishError("");
    try {
      const res = await fetch("/api/proof/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });
      const data = (await res.json()) as PublishResult;
      setPublishResult(data);
      setPublishPhase(data.success ? "done" : "error");
      if (!data.success) setPublishError(data.error ?? "Publish failed.");
    } catch (err) {
      setPublishPhase("error");
      setPublishError(err instanceof Error ? err.message : "Network error.");
    }
  };

  const resetPublish = () => {
    setPublishPhase("idle");
    setPublishResult(null);
    setPublishError("");
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


        {/* Publish panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">

          {/* Idle state */}
          {publishPhase === "idle" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-zinc-300 font-semibold text-sm">Publish proof record</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Serializes this record and publishes to BNB Chain testnet.
                  Runs as dry-run if chain config is absent.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={handlePublish}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-semibold text-sm transition-colors"
                >
                  Publish proof
                </button>
                <Link
                  href="/proof/at-risk"
                  className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 font-mono text-sm hover:bg-zinc-700 transition-colors"
                >
                  View demo
                </Link>
              </div>
            </div>
          )}

          {/* Publishing state */}
          {publishPhase === "publishing" && (
            <div className="flex items-center gap-3 py-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-zinc-400 text-sm font-mono">Publishing...</span>
            </div>
          )}

          {/* Done state */}
          {publishPhase === "done" && publishResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {publishResult.mode === "dry-run" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    DRY-RUN COMPLETE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    PUBLISHED
                  </span>
                )}
                {publishResult.chainStatus && (
                  <span
                    className={`text-xs font-mono ${
                      publishResult.chainStatus.reachable ? "text-zinc-500" : "text-zinc-700"
                    }`}
                  >
                    {publishResult.chainStatus.name}
                    &nbsp;&bull;&nbsp;
                    {publishResult.chainStatus.reachable ? "reachable" : "unreachable"}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-4">
                  <span className="text-zinc-600 text-xs w-28 shrink-0 pt-0.5">Payload hash</span>
                  <span className="text-zinc-300 text-xs font-mono break-all">
                    {publishResult.payloadHash}
                  </span>
                </div>
                {publishResult.txHash && (
                  <div className="flex items-start gap-4">
                    <span className="text-zinc-600 text-xs w-28 shrink-0 pt-0.5">TX hash</span>
                    {publishResult.explorerUrl ? (
                      <a
                        href={publishResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 text-xs font-mono break-all hover:underline underline-offset-2"
                      >
                        {publishResult.txHash}
                      </a>
                    ) : (
                      <span className="text-zinc-300 text-xs font-mono break-all">
                        {publishResult.txHash}
                      </span>
                    )}
                  </div>
                )}
                {publishResult.attestationId && (
                  <div className="flex items-start gap-4">
                    <span className="text-zinc-600 text-xs w-28 shrink-0 pt-0.5">Attestation</span>
                    <span className="text-zinc-300 text-xs font-mono break-all">
                      {publishResult.attestationId}
                    </span>
                  </div>
                )}
                {publishResult.dryRunNote && (
                  <p className="text-zinc-600 text-xs">{publishResult.dryRunNote}</p>
                )}
              </div>

              <button
                onClick={resetPublish}
                className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
              >
                Publish again
              </button>
            </div>
          )}

          {/* Error state */}
          {publishPhase === "error" && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-rose-400 text-xs font-mono">PUBLISH FAILED</span>
              </div>
              {publishResult?.payloadHash && (
                <div className="flex items-start gap-4">
                  <span className="text-zinc-600 text-xs w-28 shrink-0 pt-0.5">Payload hash</span>
                  <span className="text-zinc-400 text-xs font-mono break-all">
                    {publishResult.payloadHash}
                  </span>
                </div>
              )}
              <p className="text-zinc-500 text-xs">{publishError}</p>
              <button
                onClick={resetPublish}
                className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
              >
                Try again
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
