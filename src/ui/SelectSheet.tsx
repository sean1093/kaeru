import type { JSX } from 'preact';
import { useId, useMemo, useState } from 'preact/hooks';
import { BottomSheet } from './BottomSheet.tsx';
import { Button } from './Button.tsx';
import type { SelectSheetOption, SelectSheetProps } from './contracts.ts';
import { CheckIcon } from './icons.tsx';
import styles from './SelectSheet.module.css';

/** `components.md` section 11: the search field appears above six options, not below. */
const SEARCH_THRESHOLD = 6;

function matches(option: SelectSheetOption, query: string): boolean {
  if (query === '') return true;
  const needle = query.toLowerCase();
  return (
    option.label.toLowerCase().includes(needle) ||
    (option.secondary?.toLowerCase().includes(needle) ?? false)
  );
}

/**
 * `components.md` section 11. Used for the operator (ten options), the traveler and the
 * airport.
 *
 * Selection is held locally and committed by *Done*, rather than written through on each
 * tap. The reason is the queue: a mis-tap that silently changes which operator a receipt
 * belongs to is not visible on the screen the user returns to, and they would have no
 * reason to look. `onClose` without *Done* discards.
 */
export function SelectSheet({
  title,
  options,
  value,
  onChange,
  searchLabel,
  doneLabel,
  onClose,
}: SelectSheetProps): JSX.Element {
  const groupName = useId();
  const searchId = useId();
  const [draft, setDraft] = useState<string | null>(value);
  const [query, setQuery] = useState('');

  const searchable = options.length > SEARCH_THRESHOLD && searchLabel !== undefined;
  const visible = useMemo(
    () => (searchable ? options.filter((option) => matches(option, query)) : options),
    [options, query, searchable],
  );

  // Sentinel options ("not sure yet") stay pinned below every group, including while a
  // search is narrowing the list: it is the answer for someone who cannot find theirs.
  const grouped = new Map<string, SelectSheetOption[]>();
  const sentinels: SelectSheetOption[] = [];
  for (const option of visible) {
    if (option.sentinel) {
      sentinels.push(option);
      continue;
    }
    const key = option.group ?? '';
    const bucket = grouped.get(key);
    if (bucket) bucket.push(option);
    else grouped.set(key, [option]);
  }
  for (const option of options) {
    if (option.sentinel && !sentinels.includes(option)) sentinels.push(option);
  }

  const row = (option: SelectSheetOption) => (
    <label class={styles.option} key={option.value}>
      <input
        type="radio"
        class={styles.radio}
        name={groupName}
        value={option.value}
        checked={draft === option.value}
        onChange={() => setDraft(option.value)}
      />
      <span class={styles.optionText}>
        <span class={styles.optionLabel}>{option.label}</span>
        {option.secondary ? <span class={styles.optionSecondary}>{option.secondary}</span> : null}
      </span>
      {draft === option.value ? (
        <span class={styles.check} aria-hidden="true">
          <CheckIcon />
        </span>
      ) : null}
    </label>
  );

  return (
    <BottomSheet title={title} open onClose={onClose}>
      {searchable ? (
        <div class={styles.search}>
          <label class={styles.searchLabel} for={searchId}>
            {searchLabel}
          </label>
          <input
            id={searchId}
            type="search"
            class={styles.searchInput}
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
      ) : null}

      <div class={styles.options}>
        {[...grouped].map(([group, items]) => (
          <div class={styles.group} key={group}>
            {group === '' ? null : <p class={styles.groupHeading}>{group}</p>}
            {items.map(row)}
          </div>
        ))}
        {sentinels.length > 0 ? <div class={styles.sentinels}>{sentinels.map(row)}</div> : null}
      </div>

      <div class={styles.footer}>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            onChange(draft);
            onClose();
          }}
        >
          {doneLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
