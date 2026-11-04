import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset } from "../model/types";
import { errorMessageOf } from "./error-message";
import { loadFileDataset } from "./file";
import { loadSheetDataset } from "./sheet";

export type SourcePreference = { kind: "file" } | { kind: "sheet"; url: string };

export interface SheetFallback {
  url: string;
  reason: string;
}

export type DatasetState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      data: Dataset;
      fallback: SheetFallback | null;
      refreshing: boolean;
      refreshError: string | null;
      loadedAt: number;
    };

const MIN_REFRESH_MS = 600;
const STALE_MS = 5 * 60_000;

async function loadWithFallback(
  source: SourcePreference,
  signal: AbortSignal,
): Promise<{ data: Dataset; fallback: SheetFallback | null }> {
  if (source.kind === "file") return { data: await loadFileDataset(signal), fallback: null };
  try {
    return { data: await loadSheetDataset(source.url, signal), fallback: null };
  } catch (error) {
    if (signal.aborted) throw error;
    console.warn("Google Sheet load failed, using data.json", error);
    return { data: await loadFileDataset(signal), fallback: { url: source.url, reason: errorMessageOf(error) } };
  }
}

function sameData(a: Dataset, b: Dataset): boolean {
  return JSON.stringify(a.placements) === JSON.stringify(b.placements) && a.source.kind === b.source.kind;
}

export function useDataset(source: SourcePreference): { state: DatasetState; refresh: () => void } {
  const [state, setState] = useState<DatasetState>({ kind: "loading" });
  const [request, setRequest] = useState(0);
  const sourceKey = source.kind === "sheet" ? `sheet:${source.url}` : "file";
  const hadData = useRef(false);
  const [requestedKey, setRequestedKey] = useState(sourceKey);
  if (requestedKey !== sourceKey) {
    setRequestedKey(sourceKey);
    setState((current) => (current.kind === "ready" ? { ...current, refreshing: true, refreshError: null } : { kind: "loading" }));
  }

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    const preference: SourcePreference =
      sourceKey === "file" ? { kind: "file" } : { kind: "sheet", url: sourceKey.slice("sheet:".length) };
    let timer = 0;
    loadWithFallback(preference, controller.signal).then(
      (result) => {
        const wait = hadData.current ? Math.max(0, MIN_REFRESH_MS - (performance.now() - startedAt)) : 0;
        timer = window.setTimeout(() => {
          hadData.current = true;
          setState((current) => {
            const unchanged =
              current.kind === "ready" &&
              sameData(current.data, result.data) &&
              current.fallback?.reason === result.fallback?.reason;
            if (unchanged) return { ...current, refreshing: false, refreshError: null, loadedAt: Date.now() };
            return {
              kind: "ready",
              data: result.data,
              fallback: result.fallback,
              refreshing: false,
              refreshError: null,
              loadedAt: Date.now(),
            };
          });
        }, wait);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Dataset load failed", error);
        setState((current) =>
          current.kind === "ready"
            ? { ...current, refreshing: false, refreshError: errorMessageOf(error) }
            : { kind: "error", message: errorMessageOf(error) },
        );
      },
    );
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [sourceKey, request]);

  const refresh = useCallback(() => {
    setState((current) =>
      current.kind === "ready" ? { ...current, refreshing: true, refreshError: null } : { kind: "loading" },
    );
    setRequest((value) => value + 1);
  }, []);

  const loadedAt = state.kind === "ready" ? state.loadedAt : 0;
  useEffect(() => {
    if (sourceKey === "file" || !loadedAt) return;
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - loadedAt > STALE_MS) refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sourceKey, loadedAt, refresh]);

  return { state, refresh };
}
