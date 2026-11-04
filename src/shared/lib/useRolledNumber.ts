import { useEffect, useRef, useState } from "react";

const DURATION_MS = 300;

export function useRolledNumber(value: number): number {
  const [shown, setShown] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = reduce ? 1 : Math.min(1, (now - began) / DURATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(start + (value - start) * eased);
      current.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown;
}
