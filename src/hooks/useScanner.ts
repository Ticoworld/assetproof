"use client";

import { useState, useCallback } from "react";
import { useScanHistory } from "@/hooks/useScanHistory";

/**
 * Unified result type - single verdict, no Sherlock phase
 */
export interface UnifiedScanResult {
  // Core verdict
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  trustScore: number;
  verdict: "Safe" | "Caution" | "Danger";
  summary: string;
  criminalProfile: string;
  
  // Evidence
  lies: string[];
  evidence: string[];
  analysis: string[];
  visualAnalysis?: string;
  
  // On-chain data
  onChain: {
    mintAuth: string;
    freezeAuth: string;
    top10Percentage: number;
    creatorPercentage: number;
    isDumped: boolean;
    isWhale: boolean;
  };
  
  // Market data
  market?: {
    liquidity: number;
    volume24h: number;
    marketCap: number;
    buySellRatio: number;
    botActivity?: string;
    washTradingRatio?: number;
  };
  
  // Social links
  socials?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    imageUrl?: string;
  };
  
  // Metadata
  analyzedAt: string;
  analysisTimeSeconds: string;
}

interface UseScannerReturn {
  loading: boolean;
  error: string | null;
  result: UnifiedScanResult | null;
  scanToken: (address: string) => Promise<void>;
  reset: () => void;
}

/**
 * Validates a BNB Chain / EVM address (0x-prefixed, 40 hex chars)
 */
function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Extracts a contract address from raw input or a DexScreener/BSCScan URL
 */
function extractAddress(input: string): string {
  const cleaned = input.trim();

  // DexScreener BSC URL: dexscreener.com/bsc/0x...
  const dexMatch = cleaned.match(/dexscreener\.com\/bsc\/(0x[0-9a-fA-F]{40})/);
  if (dexMatch) return dexMatch[1];

  // BSCScan token/address URL
  const bscscanMatch = cleaned.match(/bscscan\.com\/(?:token|address)\/(0x[0-9a-fA-F]{40})/);
  if (bscscanMatch) return bscscanMatch[1];

  return cleaned;
}

export function useScanner(): UseScannerReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedScanResult | null>(null);
  const { addItem } = useScanHistory();

  const scanToken = useCallback(async (input: string) => {
    // Reset previous state
    setError(null);
    setResult(null);

    // Extract and validate address
    const address = extractAddress(input);

    if (!isValidEvmAddress(address)) {
      setError("Invalid address. Please enter a valid BNB Chain contract address (0x…) or URL.");
      return;
    }

    setLoading(true);
    console.log("[AssetProof] Starting analysis for", address);

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // SINGLE UNIFIED CALL - No two-phase display!
      // Uses URL Context + Google Search for comprehensive investigation
      // ═══════════════════════════════════════════════════════════════════════
      
      const response = await fetch("/api/analyze-unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      const scanResult: UnifiedScanResult = data.data;
      
      console.log("[AssetProof] Analysis complete:", scanResult.verdict, "trust:", scanResult.trustScore);

      setResult(scanResult);

      addItem({
        assetAddress: scanResult.tokenAddress,
        assetName: scanResult.tokenName,
        assetSymbol: scanResult.tokenSymbol,
        verdict: scanResult.verdict === "Safe" ? "Pass" : scanResult.verdict === "Danger" ? "Fail" : "Review",
        riskScore: 100 - scanResult.trustScore,
        searchedAt: new Date().toISOString(),
      });

      setLoading(false);

    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      
      // Provide more helpful error messages
      if (message.includes("not found") || message.includes("not exist")) {
        setError("Asset not found. This address may not exist on BNB Chain.");
      } else if (message.includes("fetch") || message.includes("network")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(message);
      }
      setLoading(false);
    }
  }, [addItem]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { loading, error, result, scanToken, reset };
}
