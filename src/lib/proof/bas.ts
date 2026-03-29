/**
 * BAS (BNB Attestation Service) off-chain attestation module.
 *
 * BAS is a fork of EAS (Ethereum Attestation Service) deployed on BNB Smart
 * Chain using the same contract interface. This module uses the EAS SDK — the
 * upstream library BAS is forked from — to produce EAS-compatible off-chain
 * attestations targeting BSC with BAS contract parameters.
 *
 * Off-chain pathway (used by publishProofRecord in bas-direct mode):
 *   1. ABI-encode ProofPayload fields using the registered schema string.
 *   2. Sign an EIP-712 structured attestation with the configured key.
 *   3. Return the UID, signature, and signer address — no gas or RPC call needed.
 *
 * The attestation can be stored and independently verified by anyone using
 * the signer's public address. To anchor it on-chain, submit the UID and
 * signature to the BAS/EAS contract at BAS_CONTRACT_ADDRESS.
 *
 * SERVER-ONLY — uses process.env and ethers private key signing.
 * Never import this file in client components.
 */

import {
  EAS,
  SchemaEncoder,
  Offchain,
  OffchainAttestationVersion,
} from "@ethereum-attestation-service/eas-sdk";
import { Wallet, Signature } from "ethers";
import type { ProofPayload } from "./serializer";

// ── BAS schema ───────────────────────────────────────────────────────────────

/**
 * BAS schema string for AssetProof disclosure records.
 *
 * Each field maps directly to a ProofPayload summary field.
 * payloadHash links the attestation back to the full canonical ProofPayload JSON.
 *
 * To register this schema on BSC testnet:
 *   - Call the BAS Schema Registry at BAS_CONTRACT_ADDRESS
 *   - Use the schema string below verbatim
 *   - Set resolver to address(0) and revocable to false
 *   - Record the returned schema UID as BAS_SCHEMA_UID
 */
export const BAS_SCHEMA =
  "string schemaVersion,string assetId,string assetName,string symbol," +
  "string issuer,string issuerAddress,string jurisdiction,string asOf," +
  "string trustState,uint32 verifiedSignals,uint32 expiringSignals," +
  "uint32 staleSignals,uint32 missingSignals,string payloadHash";

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * Default BAS/EAS contract addresses by chainId.
 * BAS is deployed on BNB Smart Chain using the same interface as EAS.
 * These serve as fallbacks if BAS_CONTRACT_ADDRESS is not set.
 */
const BAS_CONTRACT_DEFAULTS: Record<number, string> = {
  56: "0x6c2270298b1e6046898a322acBC5b1f9b4d16e80", // BSC mainnet
  97: "0x6c2270298b1e6046898a322acBC5b1f9b4d16e80", // BSC testnet
};

/**
 * EAS contract version string embedded in the EIP-712 domain.
 * BAS uses the same EAS contract versioning.
 */
const EAS_VERSION = "1.3.0";

export interface BasConfig {
  schemaUID: string;
  /** Hex-encoded 32-byte private key for the attestation signer. */
  privateKey: string;
  chainId: number;
  contractAddress: string;
}

/**
 * Resolves BAS config from environment variables.
 *
 * Required env vars:
 *   BAS_SCHEMA_UID   — bytes32 UID of a BAS-registered schema
 *   BAS_PRIVATE_KEY  — hex private key (0x-prefixed or raw 64 hex chars)
 *
 * Optional:
 *   BAS_CHAIN_ID          — chain ID (default: 97, BSC testnet)
 *   BAS_CONTRACT_ADDRESS  — BAS contract address (default: known BSC address)
 *
 * Returns null when required vars are absent, triggering dry-run fallback.
 */
export function resolveBasConfig(): BasConfig | null {
  const schemaUID = process.env.BAS_SCHEMA_UID?.trim();
  const privateKey = process.env.BAS_PRIVATE_KEY?.trim();

  if (!schemaUID || !privateKey) return null;

  const rawChainId = parseInt(process.env.BAS_CHAIN_ID ?? "97", 10);
  const chainId = Number.isFinite(rawChainId) && rawChainId > 0 ? rawChainId : 97;

  const contractAddress =
    process.env.BAS_CONTRACT_ADDRESS?.trim() ||
    BAS_CONTRACT_DEFAULTS[chainId] ||
    BAS_CONTRACT_DEFAULTS[97];

  return { schemaUID, privateKey, chainId, contractAddress };
}

// ── Attestation result ───────────────────────────────────────────────────────

export interface BasAttestationResult {
  /** keccak256 UID uniquely identifying this off-chain attestation. */
  uid: string;
  /** UID of the BAS schema used to encode the payload. */
  schemaUID: string;
  /** Ethereum address of the signing key (safe to expose publicly). */
  signerAddress: string;
  /** 65-byte compact EIP-712 signature as 0x-prefixed hex. */
  signature: string;
  /** Unix timestamp of attestation creation. */
  time: number;
}

// ── Off-chain signing ─────────────────────────────────────────────────────────

/**
 * Creates a BAS-compatible off-chain attestation for the given ProofPayload.
 *
 * - No blockchain transaction is made.
 * - No RPC connection is required.
 * - The attestation is fully verifiable using the signerAddress and signature.
 *
 * Throws on invalid private key or encoding failure.
 * Wrap all calls in try/catch (done in publisher.ts).
 */
export async function createBasOffchainAttestation(
  payload: ProofPayload,
  payloadHash: string,
  config: BasConfig,
): Promise<BasAttestationResult> {
  // Encode the schema fields from the ProofPayload.
  const encoder = new SchemaEncoder(BAS_SCHEMA);
  const encodedData = encoder.encodeData([
    { name: "schemaVersion",   value: payload.schemaVersion,   type: "string" },
    { name: "assetId",         value: payload.assetId,         type: "string" },
    { name: "assetName",       value: payload.assetName,       type: "string" },
    { name: "symbol",          value: payload.symbol,          type: "string" },
    { name: "issuer",          value: payload.issuer,          type: "string" },
    { name: "issuerAddress",   value: payload.issuerAddress,   type: "string" },
    { name: "jurisdiction",    value: payload.jurisdiction,    type: "string" },
    { name: "asOf",            value: payload.asOf,            type: "string" },
    { name: "trustState",      value: payload.trustState,      type: "string" },
    { name: "verifiedSignals", value: payload.summary.verified, type: "uint32" },
    { name: "expiringSignals", value: payload.summary.expiring, type: "uint32" },
    { name: "staleSignals",    value: payload.summary.stale,   type: "uint32" },
    { name: "missingSignals",  value: payload.summary.missing, type: "uint32" },
    { name: "payloadHash",     value: payloadHash,             type: "string" },
  ]);

  // Create signer from private key. Ethers v6 Wallet satisfies TypeDataSigner.
  // Errors here ("invalid private key") do not expose the key value.
  const signer = new Wallet(config.privateKey);
  const signerAddress = await signer.getAddress();

  // EAS instance — address-only, no provider needed for off-chain signing.
  const eas = new EAS(config.contractAddress);

  // Offchain helper — EIP-712 domain includes contract address + chain ID for replay protection.
  const offchain = new Offchain(
    {
      address: config.contractAddress,
      version: EAS_VERSION,
      chainId: BigInt(config.chainId),
    },
    OffchainAttestationVersion.Version2,
    eas,
  );

  const time = BigInt(Math.floor(Date.now() / 1000));

  const signed = await offchain.signOffchainAttestation(
    {
      schema:         config.schemaUID,
      recipient:      "0x0000000000000000000000000000000000000000",
      time,
      expirationTime: BigInt(0),
      revocable:      false,
      refUID:         "0x0000000000000000000000000000000000000000000000000000000000000000",
      data:           encodedData,
    },
    signer,
    { verifyOnchain: false },
  );

  // Serialize the EIP-712 signature into compact 65-byte hex (r + s + v).
  const compactSig = Signature.from({
    r: signed.signature.r,
    s: signed.signature.s,
    v: signed.signature.v,
  }).serialized;

  return {
    uid:           signed.uid,
    schemaUID:     config.schemaUID,
    signerAddress,
    signature:     compactSig,
    time:          Number(time),
  };
}
