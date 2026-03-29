/**
 * POST /api/proof/publish
 *
 * Accepts a ProofRecord, serializes it, and dispatches through the
 * proof publish pipeline (dry-run or bsc-testnet depending on env config).
 *
 * Request body:
 *   { record: ProofRecord }
 *
 * Response:
 *   PublishResult (see src/lib/proof/serializer.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { publishProofRecord } from "@/lib/proof/publisher";
import type { ProofRecord } from "@/lib/proof/model";

export async function POST(request: NextRequest) {
  let body: { record?: ProofRecord };

  try {
    body = (await request.json()) as { record?: ProofRecord };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const record = body?.record;

  if (!record || typeof record.id !== "string" || !record.summary || !Array.isArray(record.signals)) {
    return NextResponse.json(
      { success: false, error: "Missing or malformed proof record in request body." },
      { status: 400 }
    );
  }

  const result = await publishProofRecord(record);

  // Return 200 for both success and dry-run; 502 only for genuine publish failures.
  const status = result.success ? 200 : 502;
  return NextResponse.json(result, { status });
}
