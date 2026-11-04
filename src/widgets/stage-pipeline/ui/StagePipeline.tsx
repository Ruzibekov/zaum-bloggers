import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { pipelineOf, STAGE_HINT, STAGE_LABEL, type Placement, type Stage, type StageBucket } from "@/entities/placement";
import { formatCompactRub, formatShortDate, pluralRu } from "@/shared/lib/format";
import { useFirstVisit } from "@/shared/lib/useFirstVisit";
import { useRolledNumber } from "@/shared/lib/useRolledNumber";
import { edgeShift } from "../model/edge-shift";
import styles from "./StagePipeline.module.css";

interface StagePipelineProps {
  placements: readonly Placement[];
  waiting: ReadonlySet<string>;
  today: string;
  active: Stage | "all";
  onSelect: (stage: Stage) => void;
}

interface Bead {
  id: string;
  label: string;
  waiting: boolean;
}

interface Hint {
  text: string;
  x: number;
  y: number;
}

const MAX_BEADS = 8;

function beadsOf(placements: readonly Placement[], waiting: ReadonlySet<string>, year: number): Map<Stage, Bead[]> {
  const map = new Map<Stage, Bead[]>();
  const sorted = [...placements].sort(
    (a, b) =>
      Number(waiting.has(b.id)) - Number(waiting.has(a.id)) ||
      (a.date ?? "9").localeCompare(b.date ?? "9") ||
      a.row - b.row,
  );
  for (const p of sorted) {
    const list = map.get(p.stage) ?? [];
    const parts = [p.blogger, p.date ? formatShortDate(p.date, year) : "без даты"];
    if (waiting.has(p.id)) parts.push("ждёт действия");
    list.push({ id: p.id, label: parts.join(" · "), waiting: waiting.has(p.id) });
    map.set(p.stage, list);
  }
  return map;
}

export function StagePipeline({ placements, waiting, today, active, onSelect }: StagePipelineProps) {
  const buckets = useMemo(() => pipelineOf(placements), [placements]);
  const year = Number(today.slice(0, 4));
  const beads = useMemo(() => beadsOf(placements, waiting, year), [placements, waiting, year]);
  const animate = useFirstVisit("zaum:thread-drawn");
  const rootRef = useRef<HTMLElement>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    const root = rootRef.current;
    if (!tip || !root || !hint) return;
    const width = tip.offsetWidth;
    const left = root.getBoundingClientRect().left + hint.x - width / 2;
    const shift = edgeShift(left, left + width, document.documentElement.clientWidth);
    tip.style.setProperty("--shift", `${shift}px`);
  }, [hint]);

  function showHint(event: PointerEvent<HTMLElement>, text: string) {
    if (event.pointerType !== "mouse") return;
    const root = rootRef.current?.getBoundingClientRect();
    const bead = event.currentTarget.getBoundingClientRect();
    if (!root) return;
    setHint({ text, x: bead.left + bead.width / 2 - root.left, y: bead.top - root.top });
  }

  let order = 0;
  return (
    <section
      ref={rootRef}
      className={styles.thread}
      aria-labelledby="pipeline-title"
      data-animate={animate ? "" : undefined}
      style={{ "--cols": buckets.length } as CSSProperties}
    >
      <h2 id="pipeline-title" className="visually-hidden">
        Где сейчас реклама: {placements.length} {pluralRu(placements.length, "размещение", "размещения", "размещений")} по
        этапам
      </h2>
      <div className={styles.strand} aria-hidden="true" onPointerLeave={() => setHint(null)}>
        {buckets.map((bucket) => {
          const list = beads.get(bucket.stage) ?? [];
          const shown = list.slice(0, MAX_BEADS);
          return (
            <div key={bucket.stage} className={styles.knot} data-stage={bucket.stage}>
              {shown.map((bead) => (
                <span
                  key={bead.id}
                  className={styles.bead}
                  data-act={bead.waiting ? "" : undefined}
                  style={{ "--i": order++ } as CSSProperties}
                  onPointerEnter={(event) => showHint(event, bead.label)}
                  onPointerLeave={() => setHint(null)}
                />
              ))}
              {list.length === 0 ? <span className={styles.beadEmpty} /> : null}
              {list.length > MAX_BEADS ? <span className={styles.more}>+{list.length - MAX_BEADS}</span> : null}
            </div>
          );
        })}
        {hint ? (
          <span ref={tipRef} className={styles.tooltip} style={{ "--x": `${hint.x}px`, "--y": `${hint.y}px` } as CSSProperties}>
            {hint.text}
          </span>
        ) : null}
      </div>
      <ul className={styles.groups}>
        {buckets.map((bucket) => (
          <li key={bucket.stage}>
            <StageGroup
              bucket={bucket}
              waiting={(beads.get(bucket.stage) ?? []).filter((b) => b.waiting).length}
              pressed={active === bucket.stage}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StageGroup({
  bucket,
  waiting,
  pressed,
  onSelect,
}: {
  bucket: StageBucket;
  waiting: number;
  pressed: boolean;
  onSelect: (stage: Stage) => void;
}) {
  const count = useRolledNumber(bucket.count);
  const money = bucket.count ? formatCompactRub(bucket.total) : "пусто";
  const waitingText = waiting ? `${waiting} ${pluralRu(waiting, "ждёт", "ждут", "ждут")} действия` : null;
  return (
    <button
      type="button"
      className={styles.group}
      data-stage={bucket.stage}
      aria-pressed={pressed}
      onClick={() => onSelect(bucket.stage)}
    >
      <span className={styles.shape} aria-hidden="true" />
      <span className={styles.name}>{STAGE_LABEL[bucket.stage]}</span>
      <span className={styles.count}>{count}</span>
      <span className="visually-hidden">{` ${pluralRu(bucket.count, "размещение", "размещения", "размещений")}, `}</span>
      <span className={styles.meta}>
        {money}
        {waitingText ? (
          <em className={styles.waiting}>{waitingText}</em>
        ) : bucket.count ? (
          <span> · {STAGE_HINT[bucket.stage]}</span>
        ) : null}
      </span>
      <span className="visually-hidden">{pressed ? ". Снять фильтр" : ". Показать в списке"}</span>
    </button>
  );
}
