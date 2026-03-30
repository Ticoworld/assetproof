"use client";

/**
 * Reusable proof-publish interaction panel.
 *
 * Handles all four publish states (idle / publishing / done / error) and
 * calls POST /api/proof/publish internally. Safe to use in any page that
 * has access to a ProofRecord — preview drafts, seeded demo scenarios, or
 * any future asset page.
 *
 * Props:
 *   record      — The ProofRecord to publish.
 *   label       — Heading text in idle state. Default: "Publish proof record"
 *   description — Body text in idle state. Default: generic.
 *   demoHref    — If provided, renders a secondary "View demo" link in idle state.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProofRecord } from "@/lib/proof/model";
import type { PublishResult, VerificationResult } from "@/lib/proof/serializer";
import { storeReceiptByUid } from "@/lib/receipt/store";

type PublishPhase = "idle" | "publishing" | "done" | "error";

interface PublishPanelProps {
  record: ProofRecord;
  label?: string;
  description?: string;
  demoHref?: string;
}

export function PublishPanel({
  record,
  label = "Publish proof record",
  description = "Serializes and hashes the proof record for on-chain attestation. Runs as dry-run when live chain config is absent.",
  demoHref,
}: PublishPanelProps) {
  const [phase, setPhase] = useState<PublishPhase>("idle");
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string>("");

  // Restore last publish receipt for this record from sessionStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(`assetproof:receipt:${record.id}`);
    if (!stored) return;
    try {
      const data = JSON.parse(stored) as PublishResult;
      setResult(data);
      setPhase(data.success ? "done" : "error");
      if (!data.success) setError(data.error ?? "Publish failed.");
    } catch {
      // Corrupt stored data — ignore.
    }
  }, [record.id]);

  const handlePublish = async () => {
    if (phase === "publishing") return;
    setPhase("publishing");
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/proof/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record }),
      });
      const data = (await res.json()) as PublishResult;
      setResult(data);
      setPhase(data.success ? "done" : "error");
      if (!data.success) {
        setError(data.error ?? "Publish failed.");
      } else if (typeof window !== "undefined") {
        sessionStorage.setItem(`assetproof:receipt:${record.id}`, JSON.stringify(data));
        // Also persist to localStorage by UID so /verify can access it from a shared link.
        if (data.basAttestation?.uid) {
          storeReceiptByUid(data.basAttestation.uid, data);
        } else if (data.attestationId) {
          storeReceiptByUid(data.attestationId, data);
        }
      }
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Network error.");
    }
  };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setError("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`assetproof:receipt:${record.id}`);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">

      {/* ── Idle ─────────────────────────────────────────────────────── */}
      {phase === "idle" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-zinc-300 font-semibold text-sm">{label}</p>
            <p className="text-zinc-500 text-xs mt-1">{description}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handlePublish}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-semibold text-sm transition-colors"
            >
              Publish proof
            </button>
            {demoHref && (
              <Link
                href={demoHref}
                className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 font-mono text-sm hover:bg-zinc-700 transition-colors"
              >
                View demo
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Publishing ───────────────────────────────────────────────── */}
      {phase === "publishing" && (
        <div className="flex items-center gap-3 py-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-zinc-400 text-sm font-mono">Publishing...</span>
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────────────── */}
      {phase === "done" && result && (
        <div className="space-y-4">
          {/* Status badge + chain liveness */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge mode={result.mode} />
            {result.chainStatus && (
              <span
                className={`text-xs font-mono ${
                  result.chainStatus.reachable ? "text-zinc-500" : "text-zinc-700"
                }`}
              >
                {result.chainStatus.name}
                &nbsp;&bull;&nbsp;
                {result.chainStatus.reachable ? "reachable" : "unreachable"}
              </span>
            )}
          </div>

          {/* Result rows */}
          <div className="space-y-2.5">
            <ResultRow label="Payload hash" value={result.payloadHash} />
            {result.txHash && (
              <ResultRow
                label="TX hash"
                value={result.txHash}
                href={result.explorerUrl}
                linkColor="emerald"
              />
            )}
            {/* BAS direct off-chain attestation fields */}
            {result.basAttestation && (
              <>
                <ResultRow label="Attestation UID" value={result.basAttestation.uid} />
                <ResultRow label="Schema UID"      value={result.basAttestation.schemaUID} />
                <ResultRow label="Signed by"       value={result.basAttestation.signerAddress} />
              </>
            )}
            {/* relay attestation ID (no basAttestation object) */}
            {result.attestationId && !result.basAttestation && (
              <ResultRow label="Attestation" value={result.attestationId} />
            )}
            {result.dryRunNote && (
              <p className="text-zinc-600 text-xs">{result.dryRunNote}</p>
            )}
          </div>

          {/* Verification receipt */}
          {result.verification && (
            <VerificationBadge verification={result.verification} />
          )}

          {/* Proof-sharing actions */}
          {result.basAttestation?.uid && (
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-800">
              <Link
                href={`/verify?uid=${result.basAttestation.uid}`}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Verify this proof →
              </Link>
              <a
                href={`https://testnet.bascan.io/attestation/${result.basAttestation.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                View on BAS explorer ↗
              </a>
              <span className="text-zinc-800">•</span>
              <button
                onClick={() => {
                  if (result.basAttestation?.uid) {
                    navigator.clipboard.writeText(`${window.location.origin}/verify?uid=${result.basAttestation.uid}`);
                  }
                }}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Copy share link
              </button>
            </div>
          )}

          <button
            onClick={reset}
            className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
          >
            Publish again
          </button>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {phase === "error" && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span className="text-rose-400 text-xs font-mono">PUBLISH FAILED</span>
          </div>
          {result?.payloadHash && (
            <ResultRow label="Payload hash" value={result.payloadHash} />
          )}
          <p className="text-zinc-500 text-xs">{error}</p>
          <button
            onClick={reset}
            className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ── Internal helpers ─────────────────────────────────────────────────────────

type Mode = PublishResult["mode"];

function StatusBadge({ mode }: { mode: Mode }) {
  if (mode === "relay") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        PUBLISHED
      </span>
    );
  }
  if (mode === "bas-direct") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        ATTESTED
      </span>
    );
  }
  // dry-run
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      DRY-RUN COMPLETE
    </span>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  href?: string;
  linkColor?: "emerald" | "zinc";
}

// ── Verification badge ───────────────────────────────────────────────────────

const VERIFICATION_CONFIG = {
  verified:         { label: "Locally verified",   textColor: "text-emerald-400", borderColor: "border-emerald-900", bg: "bg-emerald-950/30", icon: "✓" },
  partial:          { label: "Partially verified",  textColor: "text-amber-400",   borderColor: "border-amber-900",   bg: "bg-amber-950/30",   icon: "△" },
  unverified:       { label: "Verification failed", textColor: "text-rose-400",    borderColor: "border-rose-900",    bg: "bg-rose-950/30",    icon: "✕" },
  "not-applicable": { label: "Not applicable",      textColor: "text-zinc-500",    borderColor: "border-zinc-800",    bg: "bg-zinc-900",       icon: "—" },
} as const;

function VerificationBadge({ verification }: { verification: VerificationResult }) {
  const { status, checks, note } = verification;
  const cfg = VERIFICATION_CONFIG[status];
  const passed = checks.filter((c) => c.passed).length;
  const total  = checks.length;
  const failedWithNotes = checks.filter((c) => !c.passed && c.note);

  return (
    <div className={`rounded-lg border ${cfg.borderColor} ${cfg.bg} px-3 py-2.5 space-y-1.5`}>
      <div className={`flex items-center gap-1.5 text-xs font-mono ${cfg.textColor}`}>
        <span>{cfg.icon}</span>
        <span>{cfg.label}</span>
        {total > 0 && (
          <span className="text-zinc-600">&bull; {passed}/{total} checks passed</span>
        )}
      </div>
      {note && total === 0 && (
        <p className="text-zinc-600 text-xs">{note}</p>
      )}
      {failedWithNotes.map((c) => (
        <p key={c.name} className="text-zinc-600 text-xs leading-snug">
          {c.name}: {c.note}
        </p>
      ))}
    </div>
  );
}

function ResultRow({ label, value, href, linkColor = "zinc" }: ResultRowProps) {
  const colorClass = linkColor === "emerald" ? "text-emerald-400" : "text-zinc-300";
  return (
    <div className="flex items-start gap-4">
      <span className="text-zinc-600 text-xs w-28 shrink-0 pt-0.5">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-mono break-all hover:underline underline-offset-2 ${colorClass}`}
        >
          {value}
        </a>
      ) : (
        <span className="text-zinc-300 text-xs font-mono break-all">{value}</span>
      )}
    </div>
  );
}
