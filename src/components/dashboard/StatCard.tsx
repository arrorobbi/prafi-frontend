import styles from "./dashboard.module.css";

export function StatCard({
  icon: Icon,
  color,
  bg,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bg: string;
  label: string;
  value: number | string;
  note?: string;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon} style={{ color, background: bg }}>
        <Icon />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </div>
  );
}
