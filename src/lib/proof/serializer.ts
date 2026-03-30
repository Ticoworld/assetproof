/**
 * AssetProof canonical proof serializer.
 *
 * Converts a ProofRecord into a compact, deterministic publish payload.
 * Only fields needed for on-chain verification are included.
 * UI-only fields (category labels, component config, etc.) are excluded.
 *
 * This module is intentionally pure — no Node.js APIs, no process.env.
 * Safe to import in client and server contexts. Hashing is handled
 * separately in publisher.ts (server-only).
 */

import type { ProofRecord, TrustState, SignalKey, ProofStatus } from "./model";

// ── Output types — also used as the API response contract ────────────────────

/**
 * Compact, canonical representation of a proof record suitable for
 * on-chain publishing. Designed to map to a future BAS attestation schema.
 */
export interface ProofPayload {
  /** Serialization schema version for forward compatibility. */
  schemaVersion: "1.0";
  assetId: string;
  assetName: string;
  symbol: string;
  /** Legal entity name of the issuer. */
  issuer: string;
  /** On-chain issuer wallet address. */
  issuerAddress: string;
  jurisdiction: string;
  /** YYYY-MM-DD: date on which freshness was evaluated. */
  asOf: string;
  /** YYYY-MM-DD: date the asset was first registered. */
  createdAt: string;
  trustState: TrustState;
  summary: {
    verified: number;
    expiring: number;
    stale: number;
    missing: number;
  };
  /** Per-signal freshness status and document references. */
  signals: Array<{
    key: SignalKey;
    status: ProofStatus;
    issuedAt: string;
    expiresAt: string;
    /** Empty string if document was not submitted. */
    documentUrl: string;
  }>;
}

// ── Verification types ────────────────────────────────────────────────────────

/**
 * Overall verification status for a publish receipt.
 * - verified:        all critical checks passed (signature + uid derivation)
 * - partial:         some but not all checks passed
 * - unverified:      signature check failed
 * - not-applicable:  mode does not produce a verifiable attestation (dry-run, relay)
 */
export type VerificationStatus = "verified" | "partial" | "unverified" | "not-applicable";

export interface VerificationCheck {
  /** Short machine-readable check name. */
  name: string;
  passed: boolean;
  /** Human-readable note, present only if the check failed or needs context. */
  note?: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  checks: VerificationCheck[];
  verifiedAt: string;
  /** Present for not-applicable mode — explains why verification was skipped. */
  note?: string;
}

// ── Publish result ─────────────────────────────────────────────────────────────

/** Result returned from the publish pipeline to the client. */
export interface PublishResult {
  success: boolean;
  /** The mode that was actually used (may differ from requested if fallback occurred). */
  mode: "dry-run" | "relay" | "bas-direct";
  /** SHA-256 digest of the canonical payload JSON. Format: "sha256:<hex>" */
  payloadHash: string;
  /** The exact payload that was (or would be) published. */
  payload: ProofPayload;
  /** On-chain transaction hash, if a transaction was submitted. */
  txHash?: string;
  /** BAS attestation UID or other attestation identifier, if available. */
  attestationId?: string;
  /** Direct explorer link for the transaction or attestation. */
  explorerUrl?: string;
  publishedAt: string;
  /** Liveness status of the target chain at publish time. */
  chainStatus?: {
    name: string;
    chainId: number;
    reachable: boolean;
    explorerUrl: string;
  };
  /**
   * Off-chain BAS attestation result, present only when mode is bas-direct.
   * The attestation is verifiable using signerAddress + signature without any chain call.
   */
  basAttestation?: {
    /** keccak256 UID of the off-chain attestation. */
    uid: string;
    /** UID of the BAS schema used to encode the payload. */
    schemaUID: string;
    /** Ethereum address the attestation was signed with. */
    signerAddress: string;
    /** 65-byte compact EIP-712 signature as 0x-prefixed hex. */
    signature: string;
    /** Unix timestamp of attestation creation. */
    time: number;
  };
  /** Present when mode is dry-run — explains what to configure for live publish. */
  dryRunNote?: string;
  /** Structured verification result — present after bas-direct, absent for dry-run / relay. */
  verification?: VerificationResult;
  error?: string;
}

// ── Serializer ────────────────────────────────────────────────────────────────

/**
 * Converts a ProofRecord into a canonical publish payload.
 *
 * Returns both the typed payload object and a deterministically ordered JSON
 * string suitable for hashing. The canonical JSON uses sorted keys so the
 * same ProofRecord always produces the same hash regardless of JS engine.
 */
export function serializeProofRecord(record: ProofRecord): {
  payload: ProofPayload;
  canonicalJson: string;
} {
  const payload: ProofPayload = {
    schemaVersion: "1.0",
    assetId: record.id,
    assetName: record.assetName,
    symbol: record.symbol,
    issuer: record.issuer,
    issuerAddress: record.walletAddress,
    jurisdiction: record.jurisdiction,
    asOf: record.asOf,
    createdAt: record.createdAt,
    trustState: record.summary.trust,
    summary: {
      verified: record.summary.verifiedCount,
      expiring: record.summary.expiringCount,
      stale: record.summary.staleCount,
      missing: record.summary.missingCount,
    },
    signals: record.signals.map((s) => ({
      key: s.key,
      status: s.status,
      issuedAt: s.issuedAt,
      expiresAt: s.expiresAt,
      documentUrl: s.documentUrl,
    })),
  };

  return {
    payload,
    canonicalJson: toCanonicalJson(payload),
  };
}

/**
 * Deterministic JSON serialization.
 * Object keys are sorted alphabetically at every level so the same logical
 * payload always produces the same string, regardless of insertion order.
 */
function toCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return "[" + value.map(toCanonicalJson).join(",") + "]";
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs = keys.map(
      (k) =>
        `${JSON.stringify(k)}:${toCanonicalJson((value as Record<string, unknown>)[k])}`
    );
    return "{" + pairs.join(",") + "}";
  }
  return JSON.stringify(value);
}
