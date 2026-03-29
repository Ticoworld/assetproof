/**
 * DexScreener API Client
 * Fetches market pair data and social links for a token address.
 * DexScreener is multi-chain � this client is chain-agnostic.
 *
 * NOTE: Solana-specific resolver (resolveToMintAddress) and ticker search
 * have been removed. Add BNB Chain-specific helpers in Phase 2 if needed.
 */

// Inline � DexScreener-specific shape, not a shared domain type
export interface TokenSocials {
  name?: string;
  symbol?: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface DexScreenerPairData {
  liquidity: number;
  marketCap: number;
  volume24h: number;
  buys24h: number;
  sells24h: number;
  priceChange24h: number;
  pairCreatedAt: number;
  ageInHours: number;
}

export interface DexScreenerResult {
  socials: TokenSocials;
  pairData: DexScreenerPairData | null;
}

const DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens";

// =============================================================================
// 30-SECOND DEDUPLICATION CACHE + IN-FLIGHT PROMISE DEDUP
// =============================================================================

type DexCacheEntry = { data: DexScreenerResult; expiresAt: number };
const _globalDex = globalThis as unknown as {
  _dexCache?: Map<string, DexCacheEntry>;
  _dexInflight?: Map<string, Promise<DexScreenerResult>>;
};
const _dexCache = (_globalDex._dexCache ??= new Map<string, DexCacheEntry>());
const _dexInflight = (_globalDex._dexInflight ??= new Map<string, Promise<DexScreenerResult>>());

function _dexGet(key: string): DexScreenerResult | undefined {
  const entry = _dexCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) { _dexCache.delete(key); return undefined; }
  return entry.data;
}
function _dexSet(key: string, data: DexScreenerResult): void {
  _dexCache.set(key, { data, expiresAt: Date.now() + 30_000 });
}

/**
 * Fetch market pair data and social links from DexScreener.
 * Caches for 30s. De-duplicates concurrent identical calls.
 */
export async function fetchDexScreenerData(address: string): Promise<DexScreenerResult> {
  const cached = _dexGet(address);
  if (cached) {
    console.log(`[DexScreener] Cache hit for ${address.slice(0, 8)}`);
    return cached;
  }

  const inflight = _dexInflight.get(address);
  if (inflight) return inflight;

  const promise = (async (): Promise<DexScreenerResult> => {
    try {
      console.log(`[DexScreener] Fetching ${address.slice(0, 8)}...`);

      const response = await fetch(`${DEXSCREENER_API}/${address}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.warn("[DexScreener] API error:", response.status);
        const empty: DexScreenerResult = { socials: {}, pairData: null };
        _dexSet(address, empty);
        return empty;
      }

      const data = await response.json();
      const pairs = data?.pairs;

      if (!pairs || pairs.length === 0) {
        const empty: DexScreenerResult = { socials: {}, pairData: null };
        _dexSet(address, empty);
        return empty;
      }

      const pair = pairs[0];
      const info = pair.info || {};
      const socials: TokenSocials = {};

      if (pair.baseToken) {
        socials.name = pair.baseToken.name;
        socials.symbol = pair.baseToken.symbol;
      }
      if (info.imageUrl) socials.imageUrl = info.imageUrl;
      if (info.websites) {
        const main = info.websites.find(
          (w: { label: string; url: string }) =>
            w.label.toLowerCase().includes("web") || w.label.toLowerCase() === "website"
        );
        socials.website = main?.url || info.websites[0]?.url;
      }
      if (info.socials) {
        const tw = info.socials.find((s: { type: string; url: string }) => s.type === "twitter");
        if (tw) socials.twitter = tw.url;
        const tg = info.socials.find((s: { type: string; url: string }) => s.type === "telegram");
        if (tg) socials.telegram = tg.url;
        const dc = info.socials.find((s: { type: string; url: string }) => s.type === "discord");
        if (dc) socials.discord = dc.url;
      }

      const ageInHours = pair.pairCreatedAt
        ? Math.max(0, (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60))
        : 0;

      const result: DexScreenerResult = {
        socials,
        pairData: {
          liquidity: pair.liquidity?.usd ?? 0,
          marketCap: pair.fdv ?? 0,
          volume24h: pair.volume?.h24 ?? 0,
          buys24h: pair.txns?.h24?.buys ?? 0,
          sells24h: pair.txns?.h24?.sells ?? 1,
          priceChange24h: pair.priceChange?.h24 ?? 0,
          pairCreatedAt: pair.pairCreatedAt ?? 0,
          ageInHours,
        },
      };

      _dexSet(address, result);
      return result;
    } catch (error) {
      console.error("[DexScreener] Error:", error);
      const empty: DexScreenerResult = { socials: {}, pairData: null };
      _dexSet(address, empty);
      return empty;
    }
  })();

  _dexInflight.set(address, promise);
  try {
    return await promise;
  } finally {
    _dexInflight.delete(address);
  }
}
