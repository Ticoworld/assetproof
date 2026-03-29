/**
 * AssetProof proof evaluator.
 *
 * Single shared function that converts raw issuer inputs into a fully evaluated
 * ProofRecord. Applied uniformly to: form submissions (preview flow), seeded demo
 * scenarios, and any future on-chain or API feeds.
 *
 * No page-level proof shaping should exist outside this module.
 */

import type {
  ProofRecord,
  ProofSignal,
  ProofDocument,
  ProofSummary,
  ProofStatus,
  TrustState,
  SignalKey,
  AssetCategory,
} from "./model";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Raw input for one disclosure area. */
export interface SignalInput {
  url: string;        // document URL, empty string if not provided
  issuedDate: string; // YYYY-MM-DD, empty string if not provided
  expiryDate: string; // YYYY-MM-DD, empty string if no expiry clause
  attester: string;   // entity that issued or attests the document
  docTitle: string;   // human-readable document title
}

/** Raw inputs required to build a ProofRecord. */
export interface ProofRecordInputs {
  id: string;
  assetName: string;
  symbol: string;
  category: AssetCategory;
  jurisdiction: string;
  issuer: string;
  custodyProvider: string;
  walletAddress: string;
  totalValueUsd: number;
  tokenSupply: number;
  assetStatus: "active" | "pending" | "suspended";
  createdAt: string;
  custody: SignalInput;
  valuation: SignalInput;
  legal: SignalInput;
  regulatory: SignalInput;
}

/**
 * Evaluates the freshness status for one disclosure signal.
 *
 * Rules (applied in priority order):
 *   missing  → no URL or no issuedDate, and the field is required
 *   stale    → expiry date is in the past
 *   expiring → expiry date is within 30 days from the evaluation date
 *   verified → document present and current
 *
 * @param input       Raw signal input fields.
 * @param required    Whether a missing document should be flagged (vs silently treated as verified).
 * @param asOf        Evaluation reference date. Defaults to today.
 */
export function evaluateSignalStatus(
  input: Pick<SignalInput, "url" | "issuedDate" | "expiryDate">,
  required: boolean,
  asOf: Date = new Date()
): ProofStatus {
  if (!input.url.trim() || !input.issuedDate.trim()) {
    return required ? "missing" : "verified";
  }
  if (!input.expiryDate.trim()) return "verified";
  const asOfMs = asOf.getTime();
  const expiry = new Date(input.expiryDate).getTime();
  if (isNaN(expiry)) return "verified";
  if (expiry < asOfMs) return "stale";
  if (expiry - asOfMs <= THIRTY_DAYS_MS) return "expiring";
  return "verified";
}

/**
 * Derives the overall trust state from a set of evaluated signal statuses.
 *
 *   At Risk → any signal is missing or stale
 *   Review  → any signal is expiring
 *   Healthy → all signals verified
 */
export function deriveTrustState(statuses: ProofStatus[]): TrustState {
  if (statuses.some((s) => s === "missing" || s === "stale")) return "At Risk";
  if (statuses.some((s) => s === "expiring")) return "Review";
  return "Healthy";
}

const SIGNAL_META: { key: SignalKey; label: string; required: boolean }[] = [
  { key: "custody", label: "Custody", required: true },
  { key: "valuation", label: "Valuation", required: true },
  { key: "legal", label: "Legal", required: true },
  { key: "regulatory", label: "Regulatory", required: false },
];

/**
 * Builds a fully evaluated ProofRecord from raw issuer inputs.
 *
 * @param inputs  Raw inputs describing the asset and its four disclosure areas.
 * @param asOf    YYYY-MM-DD evaluation date. Defaults to today if not provided.
 *                Pass an explicit date for seeded scenarios to keep them stable.
 */
export function buildProofRecord(
  inputs: ProofRecordInputs,
  asOf?: string
): ProofRecord {
  const evaluationDate = asOf ? new Date(asOf) : new Date();
  const asOfStr = asOf ?? evaluationDate.toISOString().split("T")[0];

  const signals: ProofSignal[] = SIGNAL_META.map(({ key, label, required }) => {
    const raw = inputs[key];
    return {
      key,
      label,
      attester: raw.attester,
      issuedAt: raw.issuedDate,
      expiresAt: raw.expiryDate,
      documentUrl: raw.url,
      status: evaluateSignalStatus(raw, required, evaluationDate),
    };
  });

  const documents: ProofDocument[] = SIGNAL_META.map(({ key }, i) => {
    const raw = inputs[key];
    return {
      id: `doc-${key}`,
      signal: key,
      title: raw.docTitle,
      url: raw.url,
      publishedAt: raw.issuedDate,
      status: signals[i].status,
    };
  });

  const statuses = signals.map((s) => s.status);
  const trust = deriveTrustState(statuses);

  const summary: ProofSummary = {
    trust,
    verifiedCount: statuses.filter((s) => s === "verified").length,
    expiringCount: statuses.filter((s) => s === "expiring").length,
    staleCount: statuses.filter((s) => s === "stale").length,
    missingCount: statuses.filter((s) => s === "missing").length,
  };

  return {
    id: inputs.id,
    assetName: inputs.assetName,
    symbol: inputs.symbol,
    category: inputs.category,
    jurisdiction: inputs.jurisdiction,
    issuer: inputs.issuer,
    custodyProvider: inputs.custodyProvider,
    walletAddress: inputs.walletAddress,
    totalValueUsd: inputs.totalValueUsd,
    tokenSupply: inputs.tokenSupply,
    assetStatus: inputs.assetStatus,
    signals,
    documents,
    summary,
    asOf: asOfStr,
    createdAt: inputs.createdAt,
  };
}
