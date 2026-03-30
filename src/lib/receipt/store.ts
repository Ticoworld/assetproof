/**
 * AssetProof receipt store.
 *
 * Persists publish receipts in localStorage keyed by attestation UID
 * so the /verify page can access them from a shared URL.
 *
 * CLIENT-ONLY — never import in server components or API routes.
 */

import type { PublishResult } from "@/lib/proof/serializer";

const PREFIX = "assetproof:receipt:uid:";

/** Persist a successful publish receipt, indexed by attestation UID. */
export function storeReceiptByUid(uid: string, result: PublishResult): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + uid.toLowerCase(), JSON.stringify(result));
  } catch {
    // localStorage full or unavailable — non-fatal
  }
}

/** Retrieve a stored receipt by attestation UID. Returns null if not found. */
export function loadReceiptByUid(uid: string): PublishResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + uid.toLowerCase());
    if (!raw) return null;
    return JSON.parse(raw) as PublishResult;
  } catch {
    return null;
  }
}

/** Returns true if uid looks like a valid 0x-prefixed 32-byte hex string. */
export function isValidUid(uid: string): boolean {
  return /^0x[0-9a-f]{64}$/i.test(uid.trim());
}
