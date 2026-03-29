/**
 * AssetProof Mock Data Layer
 * Used for Phase 2 product shell — no live chain or AI calls.
 */

export type AttestationStatus = "verified" | "stale" | "missing";
export type DisclosureType = "prospectus" | "audit" | "valuation" | "legal" | "custody";
export type AssetCategory =
  | "real-estate"
  | "commodities"
  | "treasury"
  | "private-credit"
  | "infrastructure";
export type AssetVerdict = "Pass" | "Review" | "Fail";

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
  trustScore: number;
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
    trustScore: 82,
    verdict: "Pass",
    createdAt: "2025-11-01",
    lastUpdated: "2026-01-15",
    attestations: [
      {
        id: "att-kyc",
        type: "KYC / AML Compliance",
        attester: "Sumsub Verification Services",
        attestedAt: "2025-11-05",
        expiresAt: "2026-11-05",
        status: "verified",
        schemaId: "0x0001",
      },
      {
        id: "att-custody",
        type: "Custody Verification",
        attester: "Standard Chartered Custody Services",
        attestedAt: "2025-12-01",
        expiresAt: "2026-03-01",
        status: "stale",
        schemaId: "0x0002",
      },
      {
        id: "att-valuation",
        type: "Asset Valuation",
        attester: "Jones Lang LaSalle (JLL)",
        attestedAt: "2025-06-15",
        expiresAt: "2025-12-15",
        status: "missing",
        schemaId: "0x0003",
      },
      {
        id: "att-legal",
        type: "Legal & Regulatory",
        attester: "Allen & Gledhill LLP",
        attestedAt: "2025-11-10",
        status: "verified",
        schemaId: "0x0004",
      },
      {
        id: "att-audit",
        type: "Smart Contract Audit",
        attester: "CertiK Security",
        attestedAt: "2025-10-20",
        status: "verified",
        schemaId: "0x0005",
      },
      {
        id: "att-insurance",
        type: "Insurance Coverage",
        attester: "AXA Corporate Solutions",
        attestedAt: "2025-11-15",
        expiresAt: "2026-11-15",
        status: "verified",
        schemaId: "0x0006",
      },
    ],
    disclosures: [
      {
        id: "disc-prospectus",
        title: "Offering Memorandum",
        docType: "prospectus",
        url: "https://example.com/sgot-offering-memorandum.pdf",
        publishedAt: "2025-10-20",
        status: "verified",
      },
      {
        id: "disc-audit",
        title: "Annual Financial Audit FY2025",
        docType: "audit",
        url: "https://example.com/sgot-audit-fy2025.pdf",
        publishedAt: "2025-12-15",
        status: "verified",
      },
      {
        id: "disc-valuation",
        title: "Property Valuation Report Q2 2025",
        docType: "valuation",
        url: "https://example.com/sgot-valuation-q2-2025.pdf",
        publishedAt: "2025-06-01",
        status: "stale",
      },
      {
        id: "disc-legal",
        title: "MAS Regulatory Filing",
        docType: "legal",
        url: "https://example.com/sgot-mas-filing.pdf",
        publishedAt: "2025-11-12",
        status: "verified",
      },
      {
        id: "disc-custody",
        title: "Custody Disclosure Statement",
        docType: "custody",
        url: "",
        publishedAt: "",
        status: "missing",
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
