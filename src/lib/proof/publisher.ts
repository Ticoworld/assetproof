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
 *   bsc-testnet — POSTs the serialized proof to a configured relay endpoint
 *               (PROOF_PUBLISHER_ENDPOINT). The relay is responsible for
 *               submitting to BSC testnet or BAS. Returns txHash / attestationId
 *               from the relay response. Falls back to dry-run if no endpoint
 *               is configured.
 *
 * Required env vars for bsc-testnet mode:
 *
 *   PROOF_PUBLISHER_NETWORK=bsc-testnet
 *   PROOF_PUBLISHER_ENDPOINT=https://your-relay.example.com/attest
 *
 * Optional:
 *   PROOF_PUBLISHER_API_KEY=<bearer token for the relay>
 *
 * Relay contract:
 *   POST to PROOF_PUBLISHER_ENDPOINT with body:
 *     { network, chainId, payloadHash, payload, serializedAt }
 *   Expected response (any extra fields are ignored):
 *     { txHash?, tx_hash?, attestationId?, attestation_id?, explorerUrl?, explorer_url? }
 *
 * This design lets BAS, a custom proof registry, or any attestation relay slot in
 * without changing the product model — only the endpoint URL needs to change.
 */

import { createHash } from "node:crypto";
import type { ProofRecord } from "./model";
import type { PublishResult } from "./serializer";
import { serializeProofRecord } from "./serializer";
import { BSC_TESTNET } from "./chains";

export type PublishMode = "dry-run" | "bsc-testnet";

export interface PublishConfig {
  mode: PublishMode;
  endpoint?: string;
  apiKey?: string;
}

/**
 * Derives publish config from environment variables.
 * Falls back to dry-run if required env vars are absent or incomplete.
 */
export function resolvePublishConfig(): PublishConfig {
  const networkEnv = process.env.PROOF_PUBLISHER_NETWORK?.trim();
  const endpoint = process.env.PROOF_PUBLISHER_ENDPOINT?.trim() || undefined;
  const apiKey = process.env.PROOF_PUBLISHER_API_KEY?.trim() || undefined;

  if (networkEnv === "bsc-testnet" && endpoint) {
    return { mode: "bsc-testnet", endpoint, apiKey };
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
        "Set PROOF_PUBLISHER_NETWORK=bsc-testnet and PROOF_PUBLISHER_ENDPOINT to publish on-chain.",
    };
  }

  // bsc-testnet — POST to configured relay
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
          network: "bsc-testnet",
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
      mode: "bsc-testnet",
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
      mode: "bsc-testnet",
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
