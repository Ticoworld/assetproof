import { NextResponse } from "next/server";
import type { LinkCredibility } from "@/lib/proof/model";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let testUrl: URL;
  try {
    testUrl = new URL(urlParam);
  } catch {
    return NextResponse.json({
      reachable: false,
      protocol: "other",
      checkedAt: new Date().toISOString(),
    } satisfies LinkCredibility);
  }

  const protocol = testUrl.protocol === "https:" ? "https" : testUrl.protocol === "http:" ? "http" : "other";

  if (protocol === "other") {
    return NextResponse.json({
      reachable: false,
      protocol,
      checkedAt: new Date().toISOString(),
    } satisfies LinkCredibility);
  }

  // Prevent internal network scanning
  const hostname = testUrl.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.endsWith(".local")
  ) {
    return NextResponse.json({
      reachable: false,
      protocol,
      checkedAt: new Date().toISOString(),
      fileHint: "localhost/private URL blocked"
    } satisfies LinkCredibility);
  }

  try {
    // Attempt HEAD request first
    let controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 3000);
    
    let res = await fetch(testUrl.toString(), {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "AssetProof-Verifier/1.0",
      }
    }).catch(() => null);
    
    clearTimeout(timeoutId);

    // If HEAD fails or returns 405 Method Not Allowed, fallback to minimal GET
    if (!res || res.status === 405) {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 3000);
      
      res = await fetch(testUrl.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "AssetProof-Verifier/1.0",
          "Range": "bytes=0-1024" // Keep it lightweight
        }
      }).catch(() => null);
      
      clearTimeout(timeoutId);
    }

    if (!res) {
      return NextResponse.json({
        reachable: false,
        protocol,
        checkedAt: new Date().toISOString(),
      } satisfies LinkCredibility);
    }

    const contentType = res.headers.get("content-type") || undefined;
    
    let fileHint: string | undefined;
    if (contentType) {
      const lowerCt = contentType.toLowerCase();
      if (lowerCt.includes("application/pdf")) fileHint = "pdf";
      else if (lowerCt.includes("text/html")) fileHint = "html";
      else if (lowerCt.includes("application/json")) fileHint = "json";
      else if (lowerCt.includes("image/")) fileHint = "image";
      else if (lowerCt.includes("wordprocessing") || lowerCt.includes("document")) fileHint = "doc";
    }

    return NextResponse.json({
      reachable: res.ok,
      protocol,
      status: res.status,
      contentType,
      fileHint,
      checkedAt: new Date().toISOString(),
    } satisfies LinkCredibility);

  } catch (err) {
    return NextResponse.json({
      reachable: false,
      protocol,
      checkedAt: new Date().toISOString(),
    } satisfies LinkCredibility);
  }
}
