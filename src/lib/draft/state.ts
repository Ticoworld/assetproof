/**
 * AssetProof Draft Asset State
 *
 * Stores an issuer-submitted draft in sessionStorage so /proof/preview
 * can render a believable proof page without any backend.
 *
 * Scoped to sessionStorage intentionally — drafts are ephemeral and
 * cleared when the browser tab closes. No persistence required for Phase 2.
 */

import type { MockAttestation, MockDisclosure, MockAsset, AttestationStatus, AssetVerdict } from "@/lib/mock/assets";

const DRAFT_KEY = "assetproof_draft";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface ProofInput {
  url: string;        // publicly accessible document URL
  issuedDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD — leave blank if no expiry clause
}

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
 * Freshness rules — deterministic, date-based.
 *
 *   missing   → no URL or no issued date (when required)
 *   stale     → expiry date is in the past
 *   expiring  → expiry date is within 30 days from today
 *   verified  → document present and current
 */
export function computeProofStatus(
  item: ProofInput,
  required: boolean
): AttestationStatus {
  if (!item.url.trim() || !item.issuedDate.trim()) {
    return required ? "missing" : "verified";
  }
  if (!item.expiryDate.trim()) return "verified";
  const today = Date.now();
  const expiry = new Date(item.expiryDate).getTime();
  if (isNaN(expiry)) return "verified";
  if (expiry < today) return "stale";
  if (expiry - today <= THIRTY_DAYS_MS) return "expiring";
  return "verified";
}

/**
 * Overall trust verdict — derived strictly from signal statuses (priority order).
 *
 *   At Risk → any signal is missing or stale
 *   Review  → any signal is expiring
 *   Healthy → all signals verified
 */
export function computeVerdict(statuses: AttestationStatus[]): AssetVerdict {
  if (statuses.some((s) => s === "missing" || s === "stale")) return "At Risk";
  if (statuses.some((s) => s === "expiring")) return "Review";
  return "Healthy";
}

export function buildDraftAsset(form: IssuerFormData): MockAsset {
  const today = new Date().toISOString().split("T")[0];

  const custodyStatus = computeProofStatus(form.custody, true);
  const valuationStatus = computeProofStatus(form.valuation, true);
  const legalStatus = computeProofStatus(form.legal, true);
  const regulatoryStatus = computeProofStatus(form.regulatory, false);

  const verdict = computeVerdict([custodyStatus, valuationStatus, legalStatus, regulatoryStatus]);

  const attestations: MockAttestation[] = [
    {
      id: "att-custody",
      type: "Custody",
      attester: form.custodyProvider || "Custodian",
      attestedAt: form.custody.issuedDate,
      expiresAt: form.custody.expiryDate,
      status: custodyStatus,
      schemaId: "0x0001",
    },
    {
      id: "att-valuation",
      type: "Valuation",
      attester: "Independent appraiser",
      attestedAt: form.valuation.issuedDate,
      expiresAt: form.valuation.expiryDate,
      status: valuationStatus,
      schemaId: "0x0002",
    },
    {
      id: "att-legal",
      type: "Legal",
      attester: form.jurisdiction ? `${form.jurisdiction} counsel` : "Legal counsel",
      attestedAt: form.legal.issuedDate,
      expiresAt: form.legal.expiryDate,
      status: legalStatus,
      schemaId: "0x0003",
    },
    {
      id: "att-regulatory",
      type: "Regulatory filing",
      attester: form.jurisdiction ? `${form.jurisdiction} regulator` : "Regulator",
      attestedAt: form.regulatory.issuedDate,
      expiresAt: form.regulatory.expiryDate,
      status: regulatoryStatus,
      schemaId: "0x0004",
    },
  ];

  const disclosures: MockDisclosure[] = [
    {
      id: "disc-custody",
      title: "Custody statement",
      docType: "custody",
      url: form.custody.url,
      publishedAt: form.custody.issuedDate,
      status: custodyStatus,
    },
    {
      id: "disc-valuation",
      title: "Valuation report",
      docType: "valuation",
      url: form.valuation.url,
      publishedAt: form.valuation.issuedDate,
      status: valuationStatus,
    },
    {
      id: "disc-legal",
      title: "Legal filing",
      docType: "legal",
      url: form.legal.url,
      publishedAt: form.legal.issuedDate,
      status: legalStatus,
    },
    {
      id: "disc-regulatory",
      title: "Regulatory filing",
      docType: "regulatory",
      url: form.regulatory.url,
      publishedAt: form.regulatory.issuedDate,
      status: regulatoryStatus,
    },
  ];

  return {
    id: "preview",
    address: form.issuerAddress || "0x0000000000000000000000000000000000000000",
    name: form.assetName,
    symbol: form.symbol.toUpperCase(),
    category: (form.category || "real-estate") as MockAsset["category"],
    jurisdiction: form.jurisdiction,
    issuer: form.issuerName,
    custodyProvider: form.custodyProvider,
    totalValueUsd: parseFloat(form.totalValueUsd.replace(/,/g, "")) || 0,
    tokenSupply: parseFloat(form.tokenSupply.replace(/,/g, "")) || 0,
    description: `${form.assetName} is a tokenized real-world asset registered on BNB Chain.`,
    status: "pending",
    verdict,
    createdAt: today,
    lastUpdated: today,
    attestations,
    disclosures,
  };
}

// ---- sessionStorage helpers ----

export function saveDraft(asset: MockAsset): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(asset));
  } catch {
    // sessionStorage unavailable (SSR safety)
  }
}

export function loadDraft(): MockAsset | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockAsset;
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
