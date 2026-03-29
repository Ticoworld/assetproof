/**
 * AssetProof MCP Server - "AssetProof-Intelligence"
 * Standalone entry point for local MCP testing (stdio).
 *
 * Run: npm run mcp   OR   npx tsx src/mcp-server.ts
 *
 * UNDER CONSTRUCTION - Phase 2 (BNB Chain integration) pending.
 * Tool stubs are in place and will throw informative errors until implemented.
 */

import { config } from "dotenv";

config(); // .env
config({ path: ".env.local" }); // Next.js env (overrides)

import { z } from "zod/v3";

async function main() {
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");

  const server = new McpServer({
    name: "AssetProof-Intelligence",
    version: "2.0.0",
  });

  // ============================================================================
  // analyze_asset — Phase 2 stub
  // Will perform BNB Chain RWA attestation and disclosure analysis once implemented.
  // ============================================================================
  server.tool(
    "analyze_asset",
    {
      assetAddress: z.string().describe("BNB Chain contract address of the RWA asset to analyze"),
    },
    async ({ assetAddress: _assetAddress }) => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: "Not implemented — BNB Chain integration pending. Phase 2 work required.",
            }),
          },
        ],
        isError: true,
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[AssetProof MCP] AssetProof-Intelligence v2.0 running on stdio");
  console.error("[AssetProof MCP] Tools: analyze_asset (stub — Phase 2 pending)");
}

main().catch((e) => {
  console.error("[AssetProof MCP] Fatal:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
