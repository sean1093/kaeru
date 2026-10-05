import type { JSX } from 'preact';
import styles from './Button.module.css';
import type { ButtonContractProps } from './contracts.ts';

export type ButtonProps = ButtonContractProps;

/**
 * `components.md` section 3. Three weights plus a destructive one; a screen has at most
 * one primary.
 *
 * `inactive` renders `aria-disabled` instead of the native `disabled` attribute, so the
 * control keeps its place in the tab order and a screen-reader user can reach the text
 * that explains why it is inactive. Activation is swallowed, as `aria-disabled` promises.
 * The native `disabled` attribute still works for the rare case that wants it, but prefer
 * `inactive`: a dead button with no reachable reason is a dead end for a tired user.
 */
export function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  inactive = false,
  class: extra,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      class={classes}
      aria-disabled={inactive ? 'true' : undefined}
      onClick={(event) => {
        if (inactive) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
