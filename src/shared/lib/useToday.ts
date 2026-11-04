import { useSyncExternalStore } from "react";
import { localIsoDate } from "./dates";

function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function snapshot(): string {
  return localIsoDate(new Date());
}

export function useToday(): string {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
