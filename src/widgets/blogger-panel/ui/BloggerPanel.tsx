import { useMemo, useState } from "react";
import {
  BudgetTag,
  cpmOf,
  flagsOf,
  FLAG_TITLE,
  isActionFlag,
  mismatchesOf,
  nextStepOf,
  PIPELINE,
  PlatformMark,
  STAGE_LABEL,
  stageIndex,
  totalCostOf,
  verdictFor,
  VerdictBadge,
  type CpmScale,
  type Placement,
} from "@/entities/placement";
import { MessageButton } from "@/features/blogger-message";
import { daysBetween } from "@/shared/lib/dates";
import { formatCompact, formatInt, formatRelativeDay, formatRub, pluralRu } from "@/shared/lib/format";
import { Button, CloseIcon, Dialog, ExternalIcon, StateBlock } from "@/shared/ui";
import { CpmScaleBar } from "./CpmScaleBar";
import styles from "./BloggerPanel.module.css";

interface BloggerPanelProps {
  blogger: string | null;
  placements: readonly Placement[];
  scale: CpmScale | null;
  today: string;
  onClose: () => void;
}

export function BloggerPanel({ blogger, placements, scale, today, onClose }: BloggerPanelProps) {
  const [shown, setShown] = useState(blogger);
  if (blogger && blogger !== shown) setShown(blogger);
  return (
    <Dialog open={blogger !== null} onClose={onClose} labelledBy="panel-title" variant="side">
      {shown ? <PanelBody key={shown} blogger={shown} placements={placements} scale={scale} today={today} onClose={onClose} /> : null}
    </Dialog>
  );
}

function PanelBody({ blogger, placements, scale, today, onClose }: Omit<BloggerPanelProps, "blogger"> & { blogger: string }) {
  const rows = useMemo(
    () => placements.filter((p) => p.blogger === blogger).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")),
    [placements, blogger],
  );
  const first = rows[0];
  const header = (
    <header className={styles.top}>
      <div className={styles.titleBlock} tabIndex={-1} data-autofocus="">
        <p className={styles.eyebrow}>
          {first ? ["Блогер", ...rows.map((p) => p.article).filter(Boolean)].join(" · ") : "Карточка блогера"}
        </p>
        <h2 id="panel-title" className={styles.title}>
          {first ? blogger : "Блогер не найден"}
        </h2>
      </div>
      <Button variant="icon" aria-label="Закрыть" onClick={onClose}>
        <CloseIcon />
      </Button>
    </header>
  );
  if (!first) {
    return (
      <div className={styles.sheet}>
        {header}
        <StateBlock
          title="В таблице нет такого блогера"
          action={
            <Button variant="quiet" onClick={onClose}>
              Вернуться к списку
            </Button>
          }
        >
          Возможно, ссылка устарела или блогера переименовали в таблице. Найдите его через поиск.
        </StateBlock>
      </div>
    );
  }
  return (
    <div className={styles.sheet}>
      {header}
      <div className={styles.body}>
        <div className={styles.profile}>
          <PlatformMark platform={first.platform} />
          {first.followers !== null ? (
            <span className={styles.fact}>
              <strong>{formatCompact(first.followers)}</strong> подписчиков
            </span>
          ) : null}
          {first.audienceAge ? <span className={styles.fact}>аудитория {first.audienceAge}</span> : null}
          {first.audienceGeo ? <span className={styles.fact}>{first.audienceGeo}</span> : null}
        </div>
        {rows.length > 1 ? (
          <p className={styles.multi}>
            {rows.length} {pluralRu(rows.length, "размещение", "размещения", "размещений")} в таблице
          </p>
        ) : null}
        {rows.map((p) => (
          <PlacementCard key={p.id} placement={p} scale={scale} today={today} />
        ))}
      </div>
    </div>
  );
}

function PlacementCard({ placement: p, scale, today }: { placement: Placement; scale: CpmScale | null; today: string }) {
  const flags = flagsOf(p, today).filter(isActionFlag);
  const mismatches = mismatchesOf(p, today);
  const next = nextStepOf(p, today);
  const cpm = cpmOf(p);
  const current = stageIndex(p.stage);
  const diff = p.date ? daysBetween(today, p.date) : null;
  const when =
    diff === null || diff === 0 || Math.abs(diff) === 1
      ? null
      : diff > 0
        ? `через ${diff} ${pluralRu(diff, "день", "дня", "дней")}`
        : `${-diff} ${pluralRu(-diff, "день", "дня", "дней")} назад`;
  return (
    <article className={styles.card} aria-label={`Размещение ${p.article ?? ""}`}>
      <section className={styles.block} aria-labelledby={`stage-${p.id}`}>
        <div className={styles.blockHead}>
          <h3 id={`stage-${p.id}`} className={styles.blockTitle}>
            {p.stage === "other" ? (p.statusLabel ?? STAGE_LABEL.other) : STAGE_LABEL[p.stage]}
          </h3>
          <span className={styles.when}>
            {formatRelativeDay(p.date, today)}
            {when ? ` · ${when}` : ""}
          </span>
        </div>
        <ol className={styles.stepper} aria-label="Этапы">
          {PIPELINE.map((stage, index) => (
            <li
              key={stage}
              className={styles.step}
              data-stage={stage}
              data-state={index < current ? "done" : index === current ? "current" : "todo"}
              aria-current={index === current ? "step" : undefined}
            >
              <span className={styles.bead} data-act={index === current && (flags.length || next) ? "" : undefined} />
              <span className={styles.stepLabel}>{STAGE_LABEL[stage]}</span>
            </li>
          ))}
        </ol>
        {flags.map((flag) => (
          <p key={flag} className={styles.note} data-kind="action">
            {FLAG_TITLE[flag]}
          </p>
        ))}
        {mismatches.map((text) => (
          <p key={text} className={styles.note}>
            <strong>Расхождение:</strong> {text}
          </p>
        ))}
        <div className={styles.nextStep}>
          <span className={styles.nextLabel}>Следующий шаг</span>
          <span className={styles.nextText} data-empty={next ? undefined : ""}>
            {next ?? (mismatches.length ? "Сначала сверьте данные в таблице" : "Не указан")}
          </span>
          <MessageButton placement={p} today={today} variant="panel" />
        </div>
      </section>

      <section className={styles.block} aria-labelledby={`money-${p.id}`}>
        <div className={styles.blockHead}>
          <h3 id={`money-${p.id}`} className={styles.blockTitle}>
            Деньги
          </h3>
          <BudgetTag budget={p.budget} label={p.budgetLabel} />
        </div>
        <dl className={styles.grid}>
          <Stat label="Размещение" value={p.cost === null ? null : formatRub(p.cost)} empty="не указано" />
          <Stat label="Товар (себестоимость)" value={p.productCost === null ? null : formatRub(p.productCost)} empty="не указано" />
          <Stat label="Итого" value={totalCostOf(p) === null ? null : formatRub(totalCostOf(p))} empty="—" strong />
        </dl>
      </section>

      <section className={styles.block} aria-labelledby={`cpm-${p.id}`}>
        <div className={styles.blockHead}>
          <h3 id={`cpm-${p.id}`} className={styles.blockTitle}>
            CPM
          </h3>
          <VerdictBadge verdict={verdictFor(cpm, scale)} />
        </div>
        <p className={styles.cpmValue} data-empty={cpm === null ? "" : undefined}>
          {cpm === null ? "Нет данных: нужны стоимость и охват сторис" : formatRub(cpm)}
        </p>
        {cpm !== null && scale ? <CpmScaleBar value={cpm} scale={scale} /> : null}
        <p className={styles.formula}>Стоимость размещения ÷ охват сторис × 1000 — как в таблице.</p>
      </section>

      <section className={styles.block} aria-labelledby={`audience-${p.id}`}>
        <div className={styles.blockHead}>
          <h3 id={`audience-${p.id}`} className={styles.blockTitle}>
            Охваты и формат
          </h3>
        </div>
        <dl className={styles.grid}>
          <Stat label="Охват сторис" value={p.storiesReach === null ? null : formatInt(p.storiesReach)} empty="нет данных" />
          <Stat label="Просмотры рилс" value={p.reelsViews === null ? null : formatInt(p.reelsViews)} empty="нет данных" />
          <Stat label="Формат" value={p.format} empty="не указан" />
        </dl>
      </section>

      {p.adUrl ? (
        <a className={styles.adLink} href={p.adUrl} target="_blank" rel="noreferrer noopener">
          Открыть рекламу
          <ExternalIcon width={16} height={16} />
        </a>
      ) : (
        <p className={styles.noLink}>Ссылки на рекламу в таблице нет</p>
      )}
    </article>
  );
}

function Stat({ label, value, empty, strong = false }: { label: string; value: string | null; empty: string; strong?: boolean }) {
  return (
    <div className={styles.stat} data-strong={strong ? "" : undefined}>
      <dt>{label}</dt>
      <dd data-empty={value === null ? "" : undefined}>{value ?? empty}</dd>
    </div>
  );
}
