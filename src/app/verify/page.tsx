"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, AlertCircle, ExternalLink, Search } from "lucide-react";
import { loadReceiptByUid, isValidUid } from "@/lib/receipt/store";
import type { PublishResult, VerificationResult } from "@/lib/proof/serializer";

// ── Types ─────────────────────────────────────────────────────────────────────

type VerifyPhase = "idle" | "loading" | "found" | "not-found" | "invalid-uid";

// ── Main page (wrapped in Suspense for useSearchParams) ───────────────────────

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageShell><LoadingState /></PageShell>}>
      <VerifyPageInner />
    </Suspense>
  );
}

function VerifyPageInner() {
  const searchParams = useSearchParams();
  const urlUid = searchParams.get("uid") ?? "";

  const [uid, setUid] = useState(urlUid);
  const [phase, setPhase] = useState<VerifyPhase>("idle");
  const [result, setResult] = useState<PublishResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-verify if UID came from URL
  useEffect(() => {
    if (urlUid && isValidUid(urlUid)) {
      runVerify(urlUid);
    } else if (urlUid) {
      setPhase("invalid-uid");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlUid]);

  const runVerify = (rawUid: string) => {
    const trimmed = rawUid.trim();
    if (!trimmed) { setPhase("idle"); return; }
    if (!isValidUid(trimmed)) { setPhase("invalid-uid"); return; }
    setPhase("loading");
    // Short tick so the loading state is visible
    setTimeout(() => {
      const stored = loadReceiptByUid(trimmed);
      if (stored) {
        setResult(stored);
        setPhase("found");
      } else {
        setPhase("not-found");
      }
    }, 180);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVerify(uid);
  };

  return (
    <PageShell>
      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={uid}
          onChange={e => setUid(e.target.value)}
          placeholder="Paste attestation UID — 0x…"
          spellCheck={false}
          className={[
            "flex-1 bg-zinc-950 border rounded-lg px-3 py-2.5 text-zinc-200 text-xs font-mono",
            "placeholder-zinc-700 focus:outline-none transition-colors",
            phase === "invalid-uid"
              ? "border-rose-800 focus:border-rose-600"
              : "border-zinc-800 focus:border-zinc-600",
          ].join(" ")}
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-semibold text-sm transition-colors shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          Verify
        </button>
      </form>

      {/* States */}
      {phase === "idle" && <EmptyState />}
      {phase === "loading" && <LoadingState />}
      {phase === "invalid-uid" && <InvalidUidState uid={uid} />}
      {phase === "not-found" && <NotFoundState uid={uid.trim()} />}
      {phase === "found" && result && <VerifiedResult result={result} />}
    </PageShell>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-zinc-900 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-zinc-200 tracking-tight text-sm">
          ASSETPROOF
        </Link>
        <span className="text-zinc-600 text-xs font-mono">Proof verification</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-1">
          <h1 className="text-zinc-100 font-bold text-xl">Verify a proof</h1>
          <p className="text-zinc-500 text-sm">
            Paste an attestation UID to inspect its disclosure state, trust status, and cryptographic receipt.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center">
        <Search className="w-4 h-4 text-zinc-700" />
      </div>
      <div className="space-y-1">
        <p className="text-zinc-500 text-sm">No attestation loaded.</p>
        <p className="text-zinc-700 text-xs">
          Paste a UID above, or open a verify link shared from a published proof.
        </p>
      </div>
    </div>
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-8">
      <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse shrink-0" />
      <span className="text-zinc-600 text-xs font-mono">Checking receipt…</span>
    </div>
  );
}

// ── Invalid UID state ─────────────────────────────────────────────────────────

function InvalidUidState({ uid }: { uid: string }) {
  return (
    <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 px-5 py-4 space-y-1.5">
      <div className="flex items-center gap-2 text-rose-400 text-xs font-mono">
        <AlertCircle className="w-3.5 h-3.5" />
        Invalid UID format
      </div>
      {uid && (
        <p className="text-zinc-600 text-xs font-mono break-all">{uid.trim().slice(0, 80)}{uid.trim().length > 80 ? "…" : ""}</p>
      )}
      <p className="text-zinc-500 text-xs">
        A valid attestation UID is a 0x-prefixed 32-byte hex string (66 characters total).
      </p>
    </div>
  );
}

// ── Not found state ───────────────────────────────────────────────────────────

function NotFoundState({ uid }: { uid: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-5 space-y-3">
      <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
        Receipt not found
      </div>
      <p className="text-zinc-500 text-xs leading-relaxed">
        No publish receipt was found for this UID in this browser. Receipts are stored locally after
        publishing. If you received this link from another session or device, the receipt is not
        available here.
      </p>
      {uid && (
        <>
          <p className="text-zinc-700 text-xs font-mono break-all">{uid}</p>
          <a
            href={`https://testnet.bascan.io/attestation/${uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Check on BAS explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </>
      )}
    </div>
  );
}

// ── Full verified result ──────────────────────────────────────────────────────

function VerifiedResult({ result }: { result: PublishResult }) {
  const { payload, basAttestation, verification, payloadHash, publishedAt, mode } = result;

  return (
    <div className="space-y-5">

      {/* Trust status header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-zinc-100 font-bold text-lg leading-tight">{payload.assetName}</h2>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-xs border border-zinc-800 px-1.5 py-0.5 rounded">
                {payload.symbol}
              </span>
              <span className="text-zinc-600 text-xs">{payload.jurisdiction}</span>
            </div>
          </div>
          <TrustBadge state={payload.trustState} />
        </div>

        <div className="text-zinc-500 text-xs">
          {payload.issuer}
          {payload.issuerAddress && payload.issuerAddress !== "0x0000000000000000000000000000000000000000" && (
            <span className="ml-2 font-mono text-zinc-700 break-all">{payload.issuerAddress}</span>
          )}
        </div>
        
        <div className="pt-3 mt-3 border-t border-zinc-800/60 text-zinc-400 text-sm leading-snug">
          {payload.summary.explanation}
        </div>
      </div>

      {/* Disclosure signal summary */}
      <div className="space-y-2">
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">Disclosure signals</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SignalCount label="Verified" value={payload.summary.verified} color="emerald" />
          <SignalCount label="Expiring" value={payload.summary.expiring} color="amber" />
          <SignalCount label="Stale" value={payload.summary.stale} color="rose" />
          <SignalCount label="Missing" value={payload.summary.missing} color="zinc" />
        </div>
      </div>

      {/* Signal details */}
      {payload.signals.length > 0 && (
        <div className="space-y-1.5">
          {payload.signals.map((sig) => (
            <SignalRow key={sig.key} sig={sig} />
          ))}
        </div>
      )}

      {/* Attestation details */}
      <div className="space-y-2">
        <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">Attestation receipt</p>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 divide-y divide-zinc-800/60">
          <ReceiptRow label="Mode" value={mode} mono />
          <ReceiptRow label="Published" value={new Date(publishedAt).toLocaleString()} />
          <ReceiptRow label="Evaluated on" value={payload.asOf} />
          <ReceiptRow label="Payload hash" value={payloadHash} mono truncate />
          {basAttestation && (
            <>
              <ReceiptRow label="Attestation UID" value={basAttestation.uid} mono truncate />
              <ReceiptRow label="Schema UID" value={basAttestation.schemaUID} mono truncate />
              <ReceiptRow label="Signed by" value={basAttestation.signerAddress} mono />
            </>
          )}
        </div>
      </div>

      {/* Local verification result */}
      {verification && <VerifyBadge verification={verification} />}

      {/* External links */}
      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-zinc-900">
        {basAttestation?.uid && (
          <a
            href={`https://testnet.bascan.io/attestation/${basAttestation.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View on BAS explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {basAttestation?.uid && (
          <button
            onClick={() => {
              if (basAttestation?.uid) {
                navigator.clipboard.writeText(`${window.location.origin}/verify?uid=${basAttestation.uid}`);
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Copy share link
          </button>
        )}
        <Link
          href="/issuer/new"
          className="text-xs font-mono text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          Register another asset →
        </Link>
      </div>
    </div>
  );
}

// ── Trust badge ───────────────────────────────────────────────────────────────

const TRUST_CONFIG: Record<string, { label: string; dot: string; text: string; border: string; bg: string }> = {
  Healthy: {
    label: "HEALTHY",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    border: "border-emerald-900/60",
    bg: "bg-emerald-950/30",
  },
  "Under Review": {
    label: "UNDER REVIEW",
    dot: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-900/60",
    bg: "bg-amber-950/30",
  },
  "At Risk": {
    label: "AT RISK",
    dot: "bg-rose-400",
    text: "text-rose-400",
    border: "border-rose-900/60",
    bg: "bg-rose-950/30",
  },
};

function TrustBadge({ state }: { state: string }) {
  const cfg = TRUST_CONFIG[state] ?? {
    label: state.toUpperCase(),
    dot: "bg-zinc-500",
    text: "text-zinc-400",
    border: "border-zinc-800",
    bg: "bg-zinc-900",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${cfg.border} ${cfg.bg} text-xs font-mono ${cfg.text} shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Signal summary count ──────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { text: string; bg: string; border: string }> = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-900/40" },
  amber:   { text: "text-amber-400",   bg: "bg-amber-950/30",   border: "border-amber-900/40"   },
  rose:    { text: "text-rose-400",    bg: "bg-rose-950/30",    border: "border-rose-900/40"    },
  zinc:    { text: "text-zinc-500",    bg: "bg-zinc-900/40",    border: "border-zinc-800"       },
};

function SignalCount({ label, value, color }: { label: string; value: number; color: string }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.zinc;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} px-3 py-2.5 flex flex-col gap-0.5`}>
      <span className={`text-lg font-bold font-mono ${c.text}`}>{value}</span>
      <span className="text-zinc-600 text-xs">{label}</span>
    </div>
  );
}

// ── Individual signal row ─────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  verified:   "bg-emerald-400",
  expiring:   "bg-amber-400",
  stale:      "bg-rose-400",
  missing:    "bg-zinc-700",
};

type SignalItem = { key: string; status: string; issuedAt: string; expiresAt: string; documentUrl: string };

function SignalRow({ sig }: { sig: SignalItem }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[sig.status] ?? "bg-zinc-700"}`} />
      <span className="text-zinc-300 text-xs font-mono capitalize flex-1">{sig.key}</span>
      <span className="text-zinc-600 text-xs">{sig.issuedAt || "—"}</span>
      {sig.documentUrl && (
        <a
          href={sig.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-700 hover:text-zinc-400 transition-colors"
          title="Open document"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// ── Receipt row ───────────────────────────────────────────────────────────────

function ReceiptRow({
  label,
  value,
  mono = false,
  truncate = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 px-4 py-2.5">
      <span className="text-zinc-600 text-xs w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-zinc-300 text-xs flex-1 ${mono ? "font-mono" : ""} ${truncate ? "break-all" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ── Verification badge ────────────────────────────────────────────────────────

const VERIFY_CONFIG = {
  verified:         { text: "text-emerald-400", border: "border-emerald-900/50", bg: "bg-emerald-950/20", icon: <Check className="w-3.5 h-3.5" />, label: "Locally verified" },
  partial:          { text: "text-amber-400",   border: "border-amber-900/50",   bg: "bg-amber-950/20",   icon: "△",                                label: "Partially verified" },
  unverified:       { text: "text-rose-400",    border: "border-rose-900/50",    bg: "bg-rose-950/20",    icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Verification failed" },
  "not-applicable": { text: "text-zinc-600",    border: "border-zinc-800",       bg: "bg-zinc-900/30",    icon: "—",                                label: "Not applicable" },
} as const;

function VerifyBadge({ verification }: { verification: VerificationResult }) {
  const cfg = VERIFY_CONFIG[verification.status] ?? VERIFY_CONFIG["not-applicable"];
  const passed = verification.checks.filter(c => c.passed).length;
  const total  = verification.checks.length;
  const failed = verification.checks.filter(c => !c.passed && c.note);

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3.5 space-y-2`}>
      <div className={`flex items-center gap-2 text-xs font-mono ${cfg.text}`}>
        <span className="flex items-center">{cfg.icon}</span>
        <span>{cfg.label}</span>
        {total > 0 && (
          <span className="text-zinc-600">· {passed}/{total} checks passed</span>
        )}
      </div>
      {verification.note && total === 0 && (
        <p className="text-zinc-600 text-xs">{verification.note}</p>
      )}
      {failed.map(c => (
        <p key={c.name} className="text-zinc-600 text-xs leading-snug">
          <span className="text-zinc-500">{c.name}:</span> {c.note}
        </p>
      ))}
    </div>
  );
}
