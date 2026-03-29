/**
 * AssetProof proof publisher.
 *
 * SERVER-ONLY MODULE — uses node:crypto and process.env.
 * Do not import this file directly in client components.
 * Always call it via the /api/proof/publish route.
 *
 * Publish modes:
 *
 *   dry-run     (default) — hashes the canonical payload and returns the full
 *               result without any network publish. Always works, no config needed.
 *               Includes a BSC testnet liveness check for demo context.
 *
 *   relay       — POSTs the serialized proof to a configured relay endpoint
 *               (PROOF_PUBLISHER_ENDPOINT). The relay is responsible for
 *               submitting to BSC testnet or BAS. Returns txHash / attestationId
 *               from the relay response.
 *
 *   bas-direct  — Off-chain BAS attestation via EAS SDK.
 *               Signs an EIP-712 attestation locally using BAS_PRIVATE_KEY.
 *               No gas, no blockchain transaction.
 *               Returns a signed attestation with UID and signer address.
 *               Requires: BAS_SCHEMA_UID + BAS_PRIVATE_KEY.
 *
 * Mode selection:
 *   PROOF_PUBLISHER_NETWORK=bas-direct + BAS_SCHEMA_UID + BAS_PRIVATE_KEY → bas-direct
 *   PROOF_PUBLISHER_NETWORK=relay + PROOF_PUBLISHER_ENDPOINT             → relay
 *   PROOF_PUBLISHER_NETWORK=bsc-testnet (legacy alias for relay)          → relay
 *   <anything else or incomplete config>                                   → dry-run
 */

import { createHash } from "node:crypto";
import type { ProofRecord } from "./model";
import type { PublishResult } from "./serializer";
import { serializeProofRecord } from "./serializer";
import { BSC_TESTNET } from "./chains";
import { resolveBasConfig, createBasOffchainAttestation } from "./bas";

export type PublishMode = "dry-run" | "relay" | "bas-direct";

export interface PublishConfig {
  mode: PublishMode;
  endpoint?: string;
  apiKey?: string;
}

/**
 * Derives publish config from environment variables.
 * Falls back to dry-run if required env vars are absent or incomplete.
 *
 * PROOF_PUBLISHER_NETWORK values:
 *   bas-direct     — BAS off-chain attestation (requires BAS_SCHEMA_UID + BAS_PRIVATE_KEY)
 *   relay          — POST to PROOF_PUBLISHER_ENDPOINT (requires endpoint to be set)
 *   bsc-testnet    — legacy alias for relay, accepted for backward compatibility
 *   <anything else or absent> — dry-run
 */
export function resolvePublishConfig(): PublishConfig {
  const networkEnv = process.env.PROOF_PUBLISHER_NETWORK?.trim().toLowerCase();
  const endpoint = process.env.PROOF_PUBLISHER_ENDPOINT?.trim() || undefined;
  const apiKey = process.env.PROOF_PUBLISHER_API_KEY?.trim() || undefined;

  // bas-direct mode: requires BAS_SCHEMA_UID + BAS_PRIVATE_KEY
  if (networkEnv === "bas-direct") {
    const basConfig = resolveBasConfig();
    if (basConfig) return { mode: "bas-direct" };
    // Config incomplete — fall through to relay or dry-run
  }

  // relay mode: accept both current name and legacy alias
  if ((networkEnv === "relay" || networkEnv === "bsc-testnet") && endpoint) {
    return { mode: "relay", endpoint, apiKey };
  }

  return { mode: "dry-run" };
}

/**
 * Publishes a ProofRecord through the configured pipeline.
 *
 * Resolves publish config from environment, serializes the record,
 * hashes the canonical payload, and dispatches to the appropriate mode.
 * Never throws — errors are captured in the returned PublishResult.
 */
export async function publishProofRecord(record: ProofRecord): Promise<PublishResult> {
  const config = resolvePublishConfig();
  const { payload, canonicalJson } = serializeProofRecord(record);
  const payloadHash =
    "sha256:" + createHash("sha256").update(canonicalJson, "utf8").digest("hex");
  const publishedAt = new Date().toISOString();

  // Check BSC testnet liveness regardless of mode (adds demo context).
  const chainStatus = await checkChainStatus();

  if (config.mode === "dry-run") {
    return {
      success: true,
      mode: "dry-run",
      payloadHash,
      payload,
      publishedAt,
      chainStatus,
      dryRunNote:
        "No publish config active. Set PROOF_PUBLISHER_NETWORK=bas-direct with BAS_SCHEMA_UID + BAS_PRIVATE_KEY for off-chain attestation, or PROOF_PUBLISHER_NETWORK=relay with PROOF_PUBLISHER_ENDPOINT to publish via relay.",
    };
  }

  // bas-direct — real BAS off-chain attestation via EAS SDK
  if (config.mode === "bas-direct") {
    const basConfig = resolveBasConfig();
    if (!basConfig) {
      // Should not happen (resolvePublishConfig already checked), but guard anyway.
      return {
        success: false,
        mode: "bas-direct",
        payloadHash,
        payload,
        publishedAt,
        chainStatus,
        error: "BAS config missing. Set BAS_SCHEMA_UID and BAS_PRIVATE_KEY.",
      };
    }
    try {
      const attestation = await createBasOffchainAttestation(payload, payloadHash, basConfig);
      return {
        success: true,
        mode: "bas-direct",
        payloadHash,
        payload,
        attestationId: attestation.uid,
        publishedAt,
        chainStatus,
        basAttestation: attestation,
      };
    } catch (err) {
      // Surface a clean error without leaking the private key.
      const message = err instanceof Error ? err.message : "BAS attestation failed.";
      return {
        success: false,
        mode: "bas-direct",
        payloadHash,
        payload,
        publishedAt,
        chainStatus,
        error: message.includes("private key") ? "Invalid BAS_PRIVATE_KEY." : message,
      };
    }
  }

  // relay — POST the serialized payload to the configured endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    try {
      response = await fetch(config.endpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          network: "bsc-testnet", // kept for relay contract compatibility
          chainId: BSC_TESTNET.chainId,
          payloadHash,
          payload,
          serializedAt: publishedAt,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Relay returned ${response.status}: ${text.slice(0, 300)}`);
    }

    const relayResult = (await response.json()) as {
      txHash?: string;
      tx_hash?: string;
      attestationId?: string;
      attestation_id?: string;
      explorerUrl?: string;
      explorer_url?: string;
    };

    const txHash = relayResult.txHash ?? relayResult.tx_hash;
    const attestationId = relayResult.attestationId ?? relayResult.attestation_id;
    const explorerUrl =
      relayResult.explorerUrl ??
      relayResult.explorer_url ??
      (txHash ? `${BSC_TESTNET.explorerUrl}/tx/${txHash}` : undefined);

    return {
      success: true,
      mode: "relay",
      payloadHash,
      payload,
      txHash,
      attestationId,
      explorerUrl,
      publishedAt,
      chainStatus,
    };
  } catch (err) {
    return {
      success: false,
      mode: "relay",
      payloadHash,
      payload,
      publishedAt,
      chainStatus,
      error: err instanceof Error ? err.message : "Publish failed.",
    };
  }
}

/**
 * Pings BSC testnet JSON-RPC to check liveness.
 * Included in every publish result for demo transparency.
 * Never throws — returns unreachable status on any error.
 */
async function checkChainStatus(): Promise<PublishResult["chainStatus"]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(BSC_TESTNET.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
      signal: controller.signal,
    });
    const data = (await response.json()) as { result?: string };
    const chainId = data.result ? parseInt(data.result, 16) : 0;
    return {
      name: BSC_TESTNET.name,
      chainId,
      reachable: chainId === BSC_TESTNET.chainId,
      explorerUrl: BSC_TESTNET.explorerUrl,
    };
  } catch {
    return {
      name: BSC_TESTNET.name,
      chainId: 0,
      reachable: false,
      explorerUrl: BSC_TESTNET.explorerUrl,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
