import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./Segmented.module.css";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number; ready: boolean } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const button = list?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
    if (!list || !button) return;
    const measure = () =>
      setThumb((prev) => ({ x: button.offsetLeft, w: button.offsetWidth, ready: prev !== null }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    if (list.scrollWidth <= list.clientWidth) return () => observer.disconnect();
    const left = button.offsetLeft;
    const right = left + button.offsetWidth;
    if (left < list.scrollLeft + 16 || right > list.scrollLeft + list.clientWidth - 16) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      list.scrollTo({ left: left - (list.clientWidth - button.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    }
    return () => observer.disconnect();
  }, [value]);

  const thumbStyle = thumb
    ? ({ "--thumb-x": `${thumb.x}px`, "--thumb-w": `${thumb.w}px` } as CSSProperties)
    : undefined;

  function focusAndSelect(index: number) {
    const enabled = options.filter((o) => !o.disabled);
    const option = enabled[(index + enabled.length) % enabled.length];
    if (!option) return;
    onChange(option.value);
    const button = listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${option.value}"]`);
    button?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = options.filter((o) => !o.disabled);
    const current = enabled.findIndex((o) => o.value === value);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusAndSelect(current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusAndSelect(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAndSelect(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAndSelect(enabled.length - 1);
    }
  }

  return (
    <div
      ref={listRef}
      role="radiogroup"
      aria-label={label}
      className={styles.group}
      onKeyDown={onKeyDown}
      style={thumbStyle}
    >
      {thumb ? <span className={styles.thumb} data-ready={thumb.ready ? "" : undefined} aria-hidden="true" /> : null}
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            disabled={option.disabled}
            data-value={option.value}
            className={styles.item}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            {option.hint ? <span className={styles.hint}>{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
