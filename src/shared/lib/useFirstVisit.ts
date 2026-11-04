import { useEffect, useState } from "react";

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function useFirstVisit(key: string): boolean {
  const [first] = useState(() => {
    const store = sessionStore();
    return store !== null && store.getItem(key) === null;
  });
  useEffect(() => {
    sessionStore()?.setItem(key, "1");
  }, [key]);
  return first;
}
