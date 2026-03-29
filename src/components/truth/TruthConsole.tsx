"use client";

import { useState, useRef } from "react";

type FetchStatus = "idle" | "loading" | "done" | "error";

/**
 * TruthConsole - Phase 2 stub
 *
 * The dual-fetch progressive rendering architecture (fast + slow channels,
 * independent AbortControllers) will be reinstated here once the BNB Chain
 * analysis pipeline is implemented.
 *
 * For now this component provides the input UI and surfaces the
 * "under construction" response from the API routes cleanly.
 */
export function TruthConsole() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleScan = async () => {
    const addr = address.trim();
    if (!addr || status === "loading") return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/analyze-unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
        signal: abort.signal,
      });

      if (abort.signal.aborted) return;

      const data = (await res.json()) as { success: boolean; error?: string };

      if (!data.success) {
        setMessage(data.error ?? "Analysis failed");
        setStatus("error");
        return;
      }

      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessage(err instanceof Error ? err.message : "Request failed");
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleScan();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Input row */}
      <div className="flex gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="BNB Chain asset address (0x...)"
          disabled={status === "loading"}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-100 font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
        />
        <button
          onClick={handleScan}
          disabled={!address.trim() || status === "loading"}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "..." : "Verify"}
        </button>
      </div>

      {/* Status area */}
      {status === "error" && message && (
        <div className="border border-zinc-800 rounded px-4 py-3">
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-1">
            Status
          </p>
          <p className="text-amber-500 font-mono text-sm">{message}</p>
        </div>
      )}

      {status === "idle" && (
        <p className="text-zinc-700 text-xs font-mono text-center uppercase tracking-widest">
          BNB Chain integration - Phase 2
        </p>
      )}
    </div>
  );
}
