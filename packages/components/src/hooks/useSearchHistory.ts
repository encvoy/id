import { useCallback, useEffect, useMemo, useState } from "react";

const HISTORY_MAX = 8;
const HISTORY_MIN_LENGTH = 2;

export interface UseSearchHistoryResult {
  history: string[];
  addToHistory: (value: string) => void;
  removeFromHistory: (value: string) => void;
  clearHistory: () => void;
}

export const parseSearchHistory = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
};

export const addSearchHistoryEntry = (
  history: string[],
  value: string,
): string[] => {
  const trimmed = value.trim();

  if (trimmed.length < HISTORY_MIN_LENGTH) {
    return history;
  }

  const filtered = history.filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase(),
  );

  return [trimmed, ...filtered].slice(0, HISTORY_MAX);
};

export const readSearchHistory = (storageKey: string): string[] => {
  if (typeof window === "undefined" || !storageKey) {
    return [];
  }

  try {
    return parseSearchHistory(window.localStorage.getItem(storageKey));
  } catch {
    return [];
  }
};

const writeHistory = (storageKey: string, history: string[]) => {
  if (typeof window === "undefined" || !storageKey) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // Search history is optional and must not block the primary interaction.
  }
};

export const useSearchHistory = (context: string): UseSearchHistoryResult => {
  const storageKey = useMemo(
    () => (context ? `searchHistory:${context}` : ""),
    [context],
  );
  const [history, setHistory] = useState<string[]>(() =>
    readSearchHistory(storageKey),
  );

  useEffect(() => {
    setHistory(readSearchHistory(storageKey));
  }, [storageKey]);

  const addToHistory = useCallback(
    (value: string) => {
      if (!storageKey) {
        return;
      }

      setHistory((previousHistory) => {
        const nextHistory = addSearchHistoryEntry(previousHistory, value);

        if (nextHistory !== previousHistory) {
          writeHistory(storageKey, nextHistory);
        }

        return nextHistory;
      });
    },
    [storageKey],
  );

  const removeFromHistory = useCallback(
    (value: string) => {
      if (!storageKey) {
        return;
      }

      setHistory((previousHistory) => {
        const normalizedValue = value.toLowerCase();
        const nextHistory = previousHistory.filter(
          (item) => item.toLowerCase() !== normalizedValue,
        );

        writeHistory(storageKey, nextHistory);

        return nextHistory;
      });
    },
    [storageKey],
  );

  const clearHistory = useCallback(() => {
    if (!storageKey) {
      setHistory([]);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Search history is optional and must not block the primary interaction.
    }

    setHistory([]);
  }, [storageKey]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};
