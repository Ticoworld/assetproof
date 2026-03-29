/**
 * AssetProof MCP HTTP Server - "AssetProof-Intelligence"
 * Exposes the analyze_asset tool over SSE and Streamable HTTP.
 *
 * UNDER CONSTRUCTION - Phase 2 (BNB Chain integration) pending.
 */

import "./load-env";
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";

const app = express();
const port = Number(process.env.MCP_PORT || process.env.PORT || 4000);

app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));

const mcpServer = new McpServer({
  name: "AssetProof-Intelligence",
  version: "2.0.0",
});

const serverAny = mcpServer.server as unknown as Record<string, unknown>;
if (typeof serverAny.setCapabilities === "function") {
  (serverAny.setCapabilities as (c: unknown) => void)({ tools: { listChanged: false } });
} else {
  serverAny.capabilities = (serverAny.capabilities as Record<string, unknown>) ?? {};
  (serverAny.capabilities as Record<string, unknown>).tools = { listChanged: false };
  serverAny._capabilities = serverAny.capabilities;
}

const toolDefinition = {
  name: "analyze_asset",
  description:
    "AssetProof intelligence engine for BNB Chain RWA assets. " +
    "Analyzes attestation records, disclosure documents, and on-chain compliance signals. " +
    "UNDER CONSTRUCTION � Phase 2 work required.",
  inputSchema: {
    type: "object" as const,
    properties: {
      assetAddress: {
        type: "string",
        description: "BNB Chain contract address of the RWA asset to analyze",
      },
    },
    required: ["assetAddress"],
  },
} as const;

// -- Raw MCP handlers ---------------------------------------------------------

mcpServer.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: toolDefinition.name,
      description: toolDefinition.description,
      inputSchema: toolDefinition.inputSchema,
    },
  ],
}));

mcpServer.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== toolDefinition.name) {
    throw new Error("Tool not found");
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          error: "Not implemented � BNB Chain integration pending. Phase 2 work required.",
        }),
      },
    ],
    isError: true,
  };
});

let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  try {
    transport = new SSEServerTransport("/message", res);
    await mcpServer.connect(transport);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AssetProof MCP HTTP] SSE error:", message);
    res.status(500).end();
  }
});

app.post("/message", (req, res) => {
  if (!transport) {
    res.status(503).json({ error: "SSE not initialized. Connect to /sse first." });
    return;
  }
  transport.handlePostMessage(req, res);
});

app.options("/message", (_, res) => res.sendStatus(204));
app.options("/sse", (_, res) => res.sendStatus(204));
app.options("/mcp", (_, res) => res.sendStatus(204));

// -- Streamable HTTP endpoint ( /mcp ) -----------------------------------------

const streamableTransports: Record<string, StreamableHTTPServerTransport> = {};
const streamableServer = new Server(
  { name: "AssetProof-Intelligence", version: "2.0.0" },
  { capabilities: { tools: { listChanged: false } } }
);

streamableServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: toolDefinition.name,
      description: toolDefinition.description,
      inputSchema: toolDefinition.inputSchema,
    },
  ],
}));

streamableServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== toolDefinition.name) throw new Error("Tool not found");
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: "Not implemented � BNB Chain integration pending." }),
      },
    ],
    isError: true,
  };
});

async function handleMcpPost(req: express.Request, res: express.Response) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let t: StreamableHTTPServerTransport;

  if (sessionId && streamableTransports[sessionId]) {
    t = streamableTransports[sessionId];
  } else if (
    !sessionId &&
    req.body &&
    (Array.isArray(req.body)
      ? (req.body as unknown[]).some(isInitializeRequest)
      : isInitializeRequest(req.body))
  ) {
    t = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        streamableTransports[id] = t;
      },
    });
    await streamableServer.connect(t);
  } else {
    res.status(400).json({ error: "Invalid session" });
    return;
  }

  await t.handleRequest(req, res, req.body);
}

async function handleMcpGet(req: express.Request, res: express.Response) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const t = sessionId ? streamableTransports[sessionId] : undefined;
  if (t) {
    await t.handleRequest(req, res);
  } else {
    res.status(400).json({ error: "Invalid session" });
  }
}

app.post("/mcp", express.json(), handleMcpPost);
app.get("/mcp", handleMcpGet);

// -- Health checks -------------------------------------------------------------

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: "ok",
    service: "AssetProof",
    version: "2.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

app.get("/", healthHandler);
app.get("/health", healthHandler);
app.get("/ping", healthHandler);
app.get("/sse/health", healthHandler);
app.get("/mcp/health", healthHandler);

app.listen(port, () => {
  console.log(`[AssetProof MCP HTTP] AssetProof-Intelligence listening on :${port}`);
  console.log(`[AssetProof MCP HTTP] MCP endpoint:  /mcp`);
  console.log(`[AssetProof MCP HTTP] SSE endpoint:  /sse`);
});
