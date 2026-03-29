/**
 * Supported chain configurations for proof publishing.
 *
 * Designed to slot cleanly into BAS (BNB Attestation Service) once a relay
 * or direct attestation endpoint is available. The chain config is passed
 * through the publish pipeline — nothing is hardcoded in business logic.
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;         // JSON-RPC endpoint (used for liveness checks)
  explorerUrl: string;    // block explorer base URL
  currency: string;       // native gas token ticker
}

export type NetworkId = "bsc-testnet";

export const BSC_TESTNET: ChainConfig = {
  chainId: 97,
  name: "BNB Smart Chain Testnet",
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
  explorerUrl: "https://testnet.bscscan.com",
  currency: "tBNB",
};

export const SUPPORTED_NETWORKS: Record<NetworkId, ChainConfig> = {
  "bsc-testnet": BSC_TESTNET,
};
