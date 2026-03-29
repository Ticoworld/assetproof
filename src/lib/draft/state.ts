/**
 * AssetProof Draft State
 *
 * Stores an issuer-submitted draft in sessionStorage so /proof/preview
 * can render a proof page without any backend.
 *
 * Scoped to sessionStorage intentionally — drafts are ephemeral and
 * cleared when the browser tab closes.
 */

import type { ProofRecord, AssetCategory } from "@/lib/proof/model";
import { buildProofRecord } from "@/lib/proof/evaluator";

const DRAFT_KEY = "assetproof_draft";

/** Raw user input for one disclosure area (form layer). */
export interface ProofInput {
  url: string;        // publicly accessible document URL
  issuedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD — leave blank if no expiry clause
}

/** Complete issuer form state (raw, pre-evaluation). */
export interface IssuerFormData {
  assetName: string;
  symbol: string;
  category: string;
  jurisdiction: string;
  totalValueUsd: string;
  tokenSupply: string;
  issuerName: string;
  issuerAddress: string;
  custodyProvider: string;
  custody: ProofInput;    // required — custody statement
  valuation: ProofInput;  // required — valuation report
  legal: ProofInput;      // required — legal filing
  regulatory: ProofInput; // optional — regulatory filing
}

/**
 * Converts raw issuer form data into an evaluated ProofRecord.
 * Delegates all freshness rules and trust computation to the shared evaluator.
 */
export function buildDraftProof(form: IssuerFormData): ProofRecord {
  const today = new Date().toISOString().split("T")[0];

  return buildProofRecord({
    id: "preview",
    assetName: form.assetName,
    symbol: form.symbol.toUpperCase(),
    category: (form.category || "real-estate") as AssetCategory,
    jurisdiction: form.jurisdiction,
    issuer: form.issuerName,
    custodyProvider: form.custodyProvider,
    walletAddress: form.issuerAddress || "0x0000000000000000000000000000000000000000",
    totalValueUsd: parseFloat(form.totalValueUsd.replace(/,/g, "")) || 0,
    tokenSupply: parseFloat(form.tokenSupply.replace(/,/g, "")) || 0,
    assetStatus: "pending",
    createdAt: today,
    custody: {
      url: form.custody.url,
      issuedDate: form.custody.issuedDate,
      expiryDate: form.custody.expiryDate,
      attester: form.custodyProvider || "Custodian",
      docTitle: "Custody statement",
    },
    valuation: {
      url: form.valuation.url,
      issuedDate: form.valuation.issuedDate,
      expiryDate: form.valuation.expiryDate,
      attester: "Independent appraiser",
      docTitle: "Valuation report",
    },
    legal: {
      url: form.legal.url,
      issuedDate: form.legal.issuedDate,
      expiryDate: form.legal.expiryDate,
      attester: form.jurisdiction ? `${form.jurisdiction} counsel` : "Legal counsel",
      docTitle: "Legal filing",
    },
    regulatory: {
      url: form.regulatory.url,
      issuedDate: form.regulatory.issuedDate,
      expiryDate: form.regulatory.expiryDate,
      attester: form.jurisdiction ? `${form.jurisdiction} regulator` : "Regulator",
      docTitle: "Regulatory filing",
    },
  });
  // No asOf passed — evaluates against today so the preview reflects current freshness.
}

// ── sessionStorage helpers ────────────────────────────────────────────────────

export function saveDraft(record: ProofRecord): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(record));
  } catch {
    // sessionStorage unavailable (SSR safety)
  }
}

export function loadDraft(): ProofRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProofRecord;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
