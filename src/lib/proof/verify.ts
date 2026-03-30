/**
 * AssetProof BAS attestation verifier.
 *
 * SERVER-ONLY — uses EAS SDK types. Never import in client components.
 *
 * Verifies a BAS off-chain attestation returned by createBasOffchainAttestation()
 * entirely locally — no RPC call, no network access.
 *
 * Checks performed:
 *   1. schema-uid       — signed schema UID matches the configured BAS_SCHEMA_UID.
 *   2. uid-derivation   — UID derived from attestation params matches the returned UID.
 *   3. signature        — EIP-712 signature is valid for the reported signer address.
 *   4. payload-encoding — Re-encoded schema data matches the data that was signed.
 *
 * All checks are local. No external authority is consulted.
 * If a check throws, it is recorded as failed with a note rather than propagating.
 */

import {
  EAS,
  Offchain,
  OffchainAttestationVersion,
  SchemaEncoder,
} from "@ethereum-attestation-service/eas-sdk";
import { BAS_SCHEMA } from "./bas";
import type { BasSigningOutput } from "./bas";
import type { ProofPayload, VerificationCheck, VerificationResult, VerificationStatus } from "./serializer";

const EAS_VERSION = "1.3.0";

/**
 * Verifies a bas-direct signing output against the payload that was signed.
 *
 * Returns a VerificationResult that is safe to include in the API response.
 * Never throws — all exceptions are captured as failed checks.
 */
export function verifyBasAttestation(
  output: BasSigningOutput,
  payload: ProofPayload,
  payloadHash: string,
): VerificationResult {
  const { signed, encodedData, config, attestation } = output;
  const verifiedAt = new Date().toISOString();
  const checks: VerificationCheck[] = [];

  // 1. Schema UID matches the configured BAS_SCHEMA_UID
  {
    const passed = signed.message.schema === config.schemaUID;
    checks.push({
      name: "schema-uid",
      passed,
      note: passed ? undefined : "Attestation schema UID does not match configured BAS_SCHEMA_UID.",
    });
  }

  // 2. UID re-derived from attestation params matches the UID in the signed object
  {
    let passed = false;
    let note: string | undefined;
    try {
      const derived = Offchain.getOffchainUID(
        OffchainAttestationVersion.Version2,
        signed.message.schema,
        signed.message.recipient,
        signed.message.time,
        signed.message.expirationTime,
        signed.message.revocable,
        signed.message.refUID,
        signed.message.data,
        signed.message.salt,
      );
      passed = derived === signed.uid;
      if (!passed) note = `Derived UID ${derived.slice(0, 10)}... does not match ${signed.uid.slice(0, 10)}...`;
    } catch (err) {
      note = "UID derivation threw: " + (err instanceof Error ? err.message : "unknown");
    }
    checks.push({ name: "uid-derivation", passed, note });
  }

  // 3. EIP-712 signature is valid for the reported signer address
  {
    let passed = false;
    let note: string | undefined;
    try {
      // Re-create Offchain with the same domain config to call verifyOffchainAttestationSignature.
      const eas = new EAS(config.contractAddress);
      const offchain = new Offchain(
        {
          address: config.contractAddress,
          version: EAS_VERSION,
          chainId: BigInt(config.chainId),
        },
        OffchainAttestationVersion.Version2,
        eas,
      );
      passed = offchain.verifyOffchainAttestationSignature(attestation.signerAddress, signed);
      if (!passed) note = "Signature did not verify for the reported signer address.";
    } catch (err) {
      note = "Signature verification threw: " + (err instanceof Error ? err.message : "unknown");
    }
    checks.push({ name: "signature", passed, note });
  }

  // 4. Re-encoded schema data matches the data that was signed
  {
    let passed = false;
    let note: string | undefined;
    try {
      const encoder = new SchemaEncoder(BAS_SCHEMA);
      const reEncoded = encoder.encodeData([
        { name: "schemaVersion",   value: payload.schemaVersion,    type: "string" },
        { name: "assetId",         value: payload.assetId,          type: "string" },
        { name: "assetName",       value: payload.assetName,        type: "string" },
        { name: "symbol",          value: payload.symbol,           type: "string" },
        { name: "issuer",          value: payload.issuer,           type: "string" },
        { name: "issuerAddress",   value: payload.issuerAddress,    type: "string" },
        { name: "jurisdiction",    value: payload.jurisdiction,     type: "string" },
        { name: "asOf",            value: payload.asOf,             type: "string" },
        { name: "trustState",      value: payload.trustState,       type: "string" },
        { name: "verifiedSignals", value: payload.summary.verified, type: "uint32" },
        { name: "expiringSignals", value: payload.summary.expiring, type: "uint32" },
        { name: "staleSignals",    value: payload.summary.stale,    type: "uint32" },
        { name: "missingSignals",  value: payload.summary.missing,  type: "uint32" },
        { name: "payloadHash",     value: payloadHash,              type: "string" },
      ]);
      passed = reEncoded === encodedData;
      if (!passed) note = "Re-encoded payload does not match signed data.";
    } catch (err) {
      note = "Payload encoding check threw: " + (err instanceof Error ? err.message : "unknown");
    }
    checks.push({ name: "payload-encoding", passed, note });
  }

  return { status: deriveStatus(checks), checks, verifiedAt };
}

/**
 * Returns a not-applicable VerificationResult for dry-run and relay modes.
 * No attestation object exists to verify in those cases.
 */
export function notApplicableVerification(mode: string): VerificationResult {
  return {
    status: "not-applicable",
    checks: [],
    verifiedAt: new Date().toISOString(),
    note: `Verification is not applicable for mode "${mode}". Only bas-direct off-chain attestations are locally verifiable.`,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveStatus(checks: VerificationCheck[]): VerificationStatus {
  const sigCheck  = checks.find(c => c.name === "signature");
  const uidCheck  = checks.find(c => c.name === "uid-derivation");
  const passed    = checks.filter(c => c.passed).length;
  const total     = checks.length;

  if (total === 0) return "not-applicable";

  // Both critical checks (signature + uid) passed → at least "partial", possibly "verified"
  if (sigCheck?.passed && uidCheck?.passed) {
    return passed === total ? "verified" : "partial";
  }

  // Signature or UID check failed — demote to partial or unverified
  return passed > 0 ? "partial" : "unverified";
}
