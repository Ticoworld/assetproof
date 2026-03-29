/**
 * AssetProofInvestigator
 *
 * Phase 2 placeholder — BNB Chain integration pending.
 * The investigation pipeline (phased fetch → deterministic score → AI ceiling)
 * will be implemented here once the BNB Chain data layer is in place.
 *
 * DO NOT add Solana or Pump.fun logic here.
 */

export interface InvestigationResult {
  assetAddress: string;
  status: "pending";
  message: string;
}

export class AssetProofInvestigator {
  async investigate(_assetAddress: string): Promise<InvestigationResult> {
    throw new Error(
      "Not implemented — BNB Chain integration pending. Phase 2 work required."
    );
  }
}
