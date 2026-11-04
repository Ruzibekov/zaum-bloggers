import styles from "./tags.module.css";

const SHORT: Record<string, string> = { telegram: "TG", vk: "VK", youtube: "YT", instagram: "IG", tiktok: "TT" };

export function PlatformMark({ platform, compact = false }: { platform: string | null; compact?: boolean }) {
  if (!platform) return <span className={styles.missing}>Площадка не указана</span>;
  const code = SHORT[platform.toLowerCase()] ?? platform.slice(0, 2).toUpperCase();
  return (
    <span className={styles.platform} data-platform={platform.toLowerCase()}>
      <span className={styles.platformCode} aria-hidden="true">
        {code}
      </span>
      {compact ? <span className="visually-hidden">{platform}</span> : platform}
    </span>
  );
}
