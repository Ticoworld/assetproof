/**
 * AssetProof canonical proof-record types.
 *
 * These are the authoritative domain types for the product.
 * Every page, component, and data layer consumes or produces these types.
 * Designed to map cleanly to future BAS on-chain attestation schemas.
 */

/** Freshness status of a single disclosure signal. */
export type ProofStatus = "verified" | "expiring" | "stale" | "missing";

/** Overall trust state derived from all signal statuses. */
export type TrustState = "Healthy" | "Review" | "At Risk";

/** The four canonical disclosure signals AssetProof tracks. */
export type SignalKey = "custody" | "valuation" | "legal" | "regulatory";

export type AssetCategory =
  | "real-estate"
  | "commodities"
  | "treasury"
  | "private-credit"
  | "infrastructure";

/**
 * One evaluated freshness signal for a specific disclosure area.
 * Corresponds to a future on-chain attestation schema entry.
 */
export interface ProofSignal {
  key: SignalKey;
  label: string;       // human-readable: "Custody", "Valuation", etc.
  attester: string;    // entity that issued or attests the document
  issuedAt: string;    // YYYY-MM-DD, empty string if not provided
  expiresAt: string;   // YYYY-MM-DD, empty string if no expiry clause
  documentUrl: string; // publicly accessible URL, empty string if missing
  status: ProofStatus;
}

/** One disclosed document linked to a signal. */
export interface ProofDocument {
  id: string;
  signal: SignalKey;
  title: string;
  url: string;
  publishedAt: string; // YYYY-MM-DD
  status: ProofStatus;
}

/** Aggregated trust summary across all disclosure signals. */
export interface ProofSummary {
  trust: TrustState;
  verifiedCount: number;
  expiringCount: number;
  staleCount: number;
  missingCount: number;
}

/**
 * Canonical proof record — the single unit of truth for an asset's disclosure state.
 *
 * All pages and components consume this type directly.
 * Built by the shared evaluator; never shaped ad hoc at the page level.
 */
export interface ProofRecord {
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
  /** Lifecycle status of the asset registration itself. */
  assetStatus: "active" | "pending" | "suspended";
  /** The four evaluated disclosure signals. */
  signals: ProofSignal[];
  /** The four corresponding disclosure documents. */
  documents: ProofDocument[];
  /** Aggregated trust summary computed from all signals. */
  summary: ProofSummary;
  /** YYYY-MM-DD: the date on which this proof record was evaluated. */
  asOf: string;
  /** YYYY-MM-DD: when the asset was first registered. */
  createdAt: string;
}

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: "real-estate", label: "Real Estate" },
  { value: "commodities", label: "Commodities" },
  { value: "treasury", label: "Treasury / Government Bonds" },
  { value: "private-credit", label: "Private Credit" },
  { value: "infrastructure", label: "Infrastructure" },
];
