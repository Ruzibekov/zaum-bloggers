import type { ChangeEvent } from "react";
import styles from "./SelectPill.module.css";

export interface SelectPillOption {
  value: string;
  label: string;
  short?: string;
}

interface SelectPillProps {
  label: string;
  value: string;
  options: SelectPillOption[];
  onChange: (value: string) => void;
  active?: boolean;
  className?: string;
}

export function SelectPill({ label, value, options, onChange, active = false, className }: SelectPillProps) {
  const selected = options.find((option) => option.value === value);
  const current = selected?.short ?? selected?.label ?? value;
  return (
    <label className={[styles.pill, className].filter(Boolean).join(" ")} data-active={active ? "" : undefined}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{current}</span>
      <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select
        className={styles.select}
        value={value}
        aria-label={label}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
