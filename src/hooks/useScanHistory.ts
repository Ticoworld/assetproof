"use client";

import { useState, useEffect } from "react";
import type { SearchHistoryItem } from "@/types";

const MAX_HISTORY_SIZE = 10;
const STORAGE_KEY = "assetproof_history";

export function useScanHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored) as SearchHistoryItem[]);
    } catch (e) {
      console.error("[useScanHistory] Failed to load history", e);
    }
  };

  useEffect(() => {
    loadHistory();
    setIsLoaded(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadHistory();
    };
    const handleCustomUpdate = () => loadHistory();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("assetproof-history-update", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("assetproof-history-update", handleCustomUpdate);
    };
  }, []);

  const addItem = (item: SearchHistoryItem) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const current: SearchHistoryItem[] = stored ? (JSON.parse(stored) as SearchHistoryItem[]) : [];
      const filtered = current.filter((h) => h.assetAddress !== item.assetAddress);
      const next = [item, ...filtered].slice(0, MAX_HISTORY_SIZE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setHistory(next);
      window.dispatchEvent(new Event("assetproof-history-update"));
    } catch (e) {
      console.error("[useScanHistory] Failed to add item", e);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("assetproof-history-update"));
  };

  return { history, addItem, clearHistory, isLoaded };
}
