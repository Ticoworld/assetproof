/**
 * AssetProof Unified Analyzer
 *
 * Phase 2 placeholder — BNB Chain RWA analysis prompt pending.
 * The orchestration structure (Gemini client, JSON parsing, typed result)
 * is preserved here. The Solana/Pump.fun/rug-pull prompt has been removed.
 *
 * DO NOT add Veritas, Solana, or memecoin prompt content here.
 */

import { getGeminiClient, isGeminiAvailable } from "@/lib/gemini";

export interface UnifiedAnalysisResult {
  trustScore: number;
  verdict: "Safe" | "Caution" | "Danger";
  summary: string;
  evidence: string[];
  analysis: string[];
  visualAnalysis?: string;
}

export interface UnifiedAnalysisInput {
  assetName: string;
  assetAddress: string;
  websiteUrl?: string;
  websiteScreenshot?: { base64: string; mimeType: string };
}

/**
 * Parses a JSON response string from Gemini into a typed result.
 * Kept as a shell — prompt and full implementation added in Phase 2.
 */
export function parseUnifiedResponse(text: string): UnifiedAnalysisResult | null {
  try {
    let json = text.trim();
    const block = json.match(/```json\s*([\s\S]*?)\s*```/);
    if (block) {
      json = block[1].trim();
    } else {
      const a = json.indexOf("{");
      const b = json.lastIndexOf("}");
      if (a !== -1 && b !== -1 && b > a) json = json.slice(a, b + 1);
    }

    const parsed = JSON.parse(json);
    return {
      trustScore: Math.min(100, Math.max(0, Number(parsed.trustScore) || 50)),
      verdict: parsed.verdict || "Caution",
      summary: parsed.summary || "Analysis complete.",
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      analysis: Array.isArray(parsed.analysis) ? parsed.analysis : [],
      visualAnalysis: parsed.visualAnalysis,
    };
  } catch {
    return null;
  }
}

/**
 * Stub — throws until Phase 2 prompt is implemented.
 */
export async function runUnifiedAnalysis(
  _data: UnifiedAnalysisInput
): Promise<UnifiedAnalysisResult | null> {
  if (!isGeminiAvailable()) {
    console.error("[Analyzer] No Gemini API key");
    return null;
  }
  // Verify client can be obtained (no-op until implemented)
  getGeminiClient();
  throw new Error(
    "Not implemented — BNB Chain RWA analysis prompt pending. Phase 2 work required."
  );
}
