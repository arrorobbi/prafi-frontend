import { IconSearch } from "../Icons";
import styles from "./SearchForm.module.css";

/** Orange pill search bar; a plain GET form so it works without JavaScript. */
export function SearchForm({ action, defaultValue, placeholder }: { action: string; defaultValue?: string; placeholder: string }) {
  return (
    <form action={action} role="search" className={styles.form}>
      <input name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} />
      <button type="submit" aria-label="Cari">
        <IconSearch />
      </button>
    </form>
  );
}
