/**
 * AssetProof Type Definitions
 * Domain types for RWA attestation and disclosure monitoring on BNB Chain.
 */

// -- Core domain ---------------------------------------------------------------

export type AssetRiskLevel = "unknown" | "low" | "medium" | "high" | "critical";

export interface RWAAsset {
  address: string;
  name: string;
  symbol: string;
  chain: "bnb";
  contractType?: string;
  issuerAddress?: string;
  totalSupply?: number;
  decimals?: number;
  createdAt?: string;
}

export interface DisclosureDocument {
  url: string;
  title: string;
  content?: string;
  wordCount?: number;
  fetchedAt: string;
}

export interface AttestationRecord {
  assetAddress: string;
  attesterAddress: string;
  schema: string;
  isValid: boolean;
  attestedAt: string;
  expiresAt?: string;
  data?: Record<string, unknown>;
}

export interface AssetAnalysisResult {
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  riskLevel: AssetRiskLevel;
  /** 0–100, where 100 = fully trusted */
  riskScore: number;
  verdict: "Pass" | "Review" | "Fail";
  summary: string;
  evidence: string[];
  disclosures?: DisclosureDocument[];
  attestations?: AttestationRecord[];
  analyzedAt: string;
  analysisTimeMs: number;
}

// -- API helpers ---------------------------------------------------------------

export interface ApiError {
  success: false;
  error: string;
  code?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// -- UI / history --------------------------------------------------------------

export interface SearchHistoryItem {
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  verdict: "Pass" | "Review" | "Fail";
  riskScore: number;
  searchedAt: string;
}
