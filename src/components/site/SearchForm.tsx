import { IconSearch } from "../Icons";
import styles from "./SearchForm.module.css";

/** Orange pill search bar; a plain GET form so it works without JavaScript. */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
  hidden,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  /** Kept in the search URL, e.g. the category being browsed */
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} role="search" className={styles.form}>
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} />
      <button type="submit" aria-label="Cari">
        <IconSearch />
      </button>
    </form>
  );
}
