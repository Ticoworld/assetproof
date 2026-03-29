/**
 * AssetProof Unified Analysis API
 *
 * POST /api/analyze-unified
 *
 * UNDER CONSTRUCTION - Phase 2 (BNB Chain integration) pending.
 * Returns a safe 503 response so the UI fails gracefully.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitExceededError } from "@/lib/security/RateLimiter";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || real || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    checkRateLimit(ip);

    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { success: false, error: "Asset address is required" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Analysis engine under construction - BNB Chain integration pending.",
      },
      { status: 503 }
    );
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      );
    }

    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
