/**
 * AssetProof seeded demo scenarios.
 *
 * Three canonical ProofRecords covering the full trust-state spectrum.
 * All built through the shared buildProofRecord evaluator — the same pipeline
 * the issuer form uses — guaranteeing consistency with the live flow.
 *
 * Evaluation is anchored to EVAL_DATE so scenario states remain stable
 * regardless of when the page is served.
 */

import { buildProofRecord } from "./evaluator";
import type { ProofRecord } from "./model";

/** Anchored evaluation date. Scenarios were designed against this date. */
const EVAL_DATE = "2026-03-29";

export const DEMO_SCENARIOS: Record<string, ProofRecord> = {
  // ── Scenario 1: Healthy ─────────────────────────────────────────────────
  // All four signals verified and well within expiry.
  // Represents a well-maintained treasury / bond fund.
  healthy: buildProofRecord(
    {
      id: "healthy",
      assetName: "APAC Infrastructure Income Fund",
      symbol: "AIIF",
      category: "infrastructure",
      jurisdiction: "Hong Kong SAR",
      issuer: "Pacific Capital Management Ltd.",
      custodyProvider: "HSBC Securities Services",
      walletAddress: "0x4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b",
      totalValueUsd: 120_000_000,
      tokenSupply: 120_000_000,
      assetStatus: "active",
      createdAt: "2025-07-01",
      custody: {
        url: "/demo-docs/aiif-custody-2026-q1.html",
        issuedDate: "2026-01-15",
        expiryDate: "2026-12-31",
        attester: "HSBC Securities Services",
        docTitle: "Custody Statement Q1 2026",
      },
      valuation: {
        url: "/demo-docs/aiif-valuation-2025-dec.html",
        issuedDate: "2025-12-10",
        expiryDate: "2026-12-10",
        attester: "Colliers International",
        docTitle: "Annual Valuation Report 2025",
      },
      legal: {
        url: "/demo-docs/aiif-sfc-filing.html",
        issuedDate: "2025-07-05",
        expiryDate: "2027-07-05",
        attester: "Clifford Chance LLP",
        docTitle: "SFC Regulatory Filing",
      },
      regulatory: {
        url: "/demo-docs/aiif-sfc-registration.html",
        issuedDate: "2025-07-01",
        expiryDate: "2027-07-01",
        attester: "Securities and Futures Commission (SFC)",
        docTitle: "SFC Capital Markets Registration",
      },
    },
    EVAL_DATE
  ),

  // ── Scenario 2: Review ──────────────────────────────────────────────────
  // Custody statement expires in 3 days (2026-04-01 — within 30-day window).
  // All other signals verified. Issuer needs to renew custody documentation.
  review: buildProofRecord(
    {
      id: "review",
      assetName: "Singapore Grade-A Office Trust",
      symbol: "SGOT",
      category: "real-estate",
      jurisdiction: "Singapore",
      issuer: "Capital Realty Partners Pte. Ltd.",
      custodyProvider: "Standard Chartered Custody Services",
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9E8e0b59F6aA1",
      totalValueUsd: 48_000_000,
      tokenSupply: 48_000_000,
      assetStatus: "active",
      createdAt: "2025-11-01",
      custody: {
        url: "/demo-docs/sgot-custody-q1-2026.html",
        issuedDate: "2026-01-01",
        expiryDate: "2026-04-01", // 3 days from EVAL_DATE → expiring
        attester: "Standard Chartered Custody Services",
        docTitle: "Custody Statement Q1 2026",
      },
      valuation: {
        url: "/demo-docs/sgot-valuation-2025.html",
        issuedDate: "2025-10-15",
        expiryDate: "2026-10-15",
        attester: "Jones Lang LaSalle (JLL)",
        docTitle: "Annual Valuation Report 2025",
      },
      legal: {
        url: "/demo-docs/sgot-mas-filing.html",
        issuedDate: "2025-11-10",
        expiryDate: "2026-11-10",
        attester: "Allen & Gledhill LLP",
        docTitle: "MAS Legal Filing",
      },
      regulatory: {
        url: "/demo-docs/sgot-mas-registration.html",
        issuedDate: "2025-11-01",
        expiryDate: "2026-11-01",
        attester: "MAS Singapore",
        docTitle: "MAS Capital Markets Registration",
      },
    },
    EVAL_DATE
  ),

  // ── Scenario 3: At Risk ─────────────────────────────────────────────────
  // Custody statement expired (2025-12-31 — stale).
  // Valuation report not submitted (missing).
  // Represents a non-compliant asset requiring immediate issuer action.
  "at-risk": buildProofRecord(
    {
      id: "at-risk",
      assetName: "Dubai Logistics Warehouse Fund",
      symbol: "DLWF",
      category: "real-estate",
      jurisdiction: "UAE (DIFC)",
      issuer: "Gulf Real Assets Management LLC",
      custodyProvider: "Emirates NBD Custody",
      walletAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      totalValueUsd: 75_000_000,
      tokenSupply: 75_000_000,
      assetStatus: "active",
      createdAt: "2024-09-01",
      custody: {
        url: "/demo-docs/dlwf-custody-2025.html",
        issuedDate: "2025-04-01",
        expiryDate: "2025-12-31", // before EVAL_DATE → stale
        attester: "Emirates NBD Custody",
        docTitle: "Custody Statement 2025",
      },
      valuation: {
        url: "",        // not submitted → missing
        issuedDate: "",
        expiryDate: "",
        attester: "Knight Frank MENA",
        docTitle: "Valuation Report",
      },
      legal: {
        url: "/demo-docs/dlwf-difc-filing.html",
        issuedDate: "2024-09-15",
        expiryDate: "2026-09-15",
        attester: "Linklaters LLP",
        docTitle: "DIFC Regulatory Filing",
      },
      regulatory: {
        url: "/demo-docs/dlwf-dfsa-registration.html",
        issuedDate: "2024-09-01",
        expiryDate: "2026-09-01",
        attester: "Dubai Financial Services Authority (DFSA)",
        docTitle: "DFSA Registration Certificate",
      },
    },
    EVAL_DATE
  ),
};

/** Returns the seeded ProofRecord for a given scenario ID, or null if not found. */
export function getProofRecord(id: string): ProofRecord | null {
  return DEMO_SCENARIOS[id] ?? null;
}

/** Ordered list of all demo scenarios for index/listing pages. */
export const SCENARIO_LIST = Object.values(DEMO_SCENARIOS);
