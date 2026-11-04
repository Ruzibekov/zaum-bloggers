import { useCallback, useSyncExternalStore } from "react";
import { buildHash, parseHash, type HashRoute } from "./hash-route";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function snapshot(): string {
  return window.location.hash;
}

export function useHashRoute(): {
  route: HashRoute;
  navigate: (next: HashRoute, mode?: "push" | "replace") => void;
} {
  const hash = useSyncExternalStore(subscribe, snapshot, () => "");
  const route = parseHash(hash);

  const navigate = useCallback((next: HashRoute, mode: "push" | "replace" = "push") => {
    const target = buildHash(next);
    if (target === window.location.hash) return;
    if (mode === "replace") {
      window.history.replaceState(window.history.state, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      window.location.hash = target;
    }
  }, []);

  return { route, navigate };
}
