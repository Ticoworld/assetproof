/**
 * AssetProof Mock Data Layer
 * Used for Phase 2 product shell — no live chain or AI calls.
 */

export type AttestationStatus = "verified" | "expiring" | "stale" | "missing";
export type DisclosureType = "custody" | "valuation" | "legal" | "regulatory";
export type AssetCategory =
  | "real-estate"
  | "commodities"
  | "treasury"
  | "private-credit"
  | "infrastructure";
export type AssetVerdict = "Healthy" | "Review" | "At Risk";

export interface MockAttestation {
  id: string;
  type: string;
  attester: string;
  attestedAt: string;
  expiresAt?: string;
  status: AttestationStatus;
  schemaId: string;
}

export interface MockDisclosure {
  id: string;
  title: string;
  docType: DisclosureType;
  url: string;
  publishedAt: string;
  status: AttestationStatus;
}

export interface MockAsset {
  id: string;
  address: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  jurisdiction: string;
  issuer: string;
  custodyProvider: string;
  totalValueUsd: number;
  tokenSupply: number;
  description: string;
  status: "active" | "suspended" | "pending";
  verdict: AssetVerdict;
  createdAt: string;
  lastUpdated: string;
  attestations: MockAttestation[];
  disclosures: MockDisclosure[];
}

export const MOCK_ASSETS: Record<string, MockAsset> = {
  "demo-asset": {
    id: "demo-asset",
    address: "0x742d35Cc6634C0532925a3b8D4C9E8e0b59F6aA1",
    name: "Singapore Grade-A Office Trust",
    symbol: "SGOT",
    category: "real-estate",
    jurisdiction: "Singapore",
    issuer: "Capital Realty Partners Pte. Ltd.",
    custodyProvider: "Standard Chartered Custody Services",
    totalValueUsd: 48_000_000,
    tokenSupply: 48_000_000,
    description:
      "Tokenized fractional ownership in a Grade-A commercial office building in Singapore's Central Business District. Regulated under MAS Guidelines on Digital Token Offerings.",
    status: "active",
    verdict: "At Risk",
    createdAt: "2025-11-01",
    lastUpdated: "2026-03-29",
    attestations: [
      {
        id: "att-custody",
        type: "Custody",
        attester: "Standard Chartered Custody Services",
        attestedAt: "2026-01-01",
        expiresAt: "2026-04-01",
        status: "expiring",
        schemaId: "0x0001",
      },
      {
        id: "att-valuation",
        type: "Valuation",
        attester: "Jones Lang LaSalle (JLL)",
        attestedAt: "",
        expiresAt: "",
        status: "missing",
        schemaId: "0x0002",
      },
      {
        id: "att-legal",
        type: "Legal",
        attester: "Allen & Gledhill LLP",
        attestedAt: "2025-11-10",
        expiresAt: "2026-11-10",
        status: "verified",
        schemaId: "0x0003",
      },
      {
        id: "att-regulatory",
        type: "Regulatory filing",
        attester: "MAS Singapore",
        attestedAt: "2025-11-01",
        expiresAt: "2026-11-01",
        status: "verified",
        schemaId: "0x0004",
      },
    ],
    disclosures: [
      {
        id: "disc-custody",
        title: "Custody Statement Q1 2026",
        docType: "custody",
        url: "https://example.com/sgot-custody-statement-q1-2026.pdf",
        publishedAt: "2026-01-01",
        status: "expiring",
      },
      {
        id: "disc-valuation",
        title: "Valuation Report",
        docType: "valuation",
        url: "",
        publishedAt: "",
        status: "missing",
      },
      {
        id: "disc-legal",
        title: "MAS Legal Filing",
        docType: "legal",
        url: "https://example.com/sgot-mas-filing.pdf",
        publishedAt: "2025-11-12",
        status: "verified",
      },
      {
        id: "disc-regulatory",
        title: "MAS Capital Markets Registration",
        docType: "regulatory",
        url: "https://example.com/sgot-mas-registration.pdf",
        publishedAt: "2025-11-01",
        status: "verified",
      },
    ],
  },
};

export function getMockAsset(id: string): MockAsset | null {
  return MOCK_ASSETS[id] ?? null;
}

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: "real-estate", label: "Real Estate" },
  { value: "commodities", label: "Commodities" },
  { value: "treasury", label: "Treasury / Government Bonds" },
  { value: "private-credit", label: "Private Credit" },
  { value: "infrastructure", label: "Infrastructure" },
];
