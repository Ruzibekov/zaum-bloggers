import { useCallback, useSyncExternalStore } from "react";
import { DEMO_SHEET_URL, parseSheetUrl, type SourcePreference } from "@/entities/placement";

const KEY = "zaum-bloggers:source";
const EVENT = "zaum-bloggers:source";

export const DEFAULT_SHEET_URL: string = import.meta.env.VITE_SHEET_URL || DEMO_SHEET_URL;

export function parsePreference(raw: string | null): SourcePreference {
  if (raw === "file") return { kind: "file" };
  if (raw && parseSheetUrl(raw)) return { kind: "sheet", url: raw };
  return { kind: "sheet", url: DEFAULT_SHEET_URL };
}

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch (error) {
    console.warn("Source preference is not readable", error);
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useSourcePreference(): [SourcePreference, (next: SourcePreference) => void] {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const preference = parsePreference(raw);
  const update = useCallback((next: SourcePreference) => {
    const value = next.kind === "file" ? "file" : next.url;
    try {
      if (next.kind === "sheet" && next.url === DEFAULT_SHEET_URL) window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, value);
    } catch (error) {
      console.warn("Source preference is not saved", error);
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [preference, update];
}
