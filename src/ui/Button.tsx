import type { ButtonHTMLAttributes, JSX } from 'preact';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'quiet';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  class: extra,
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [styles.button, styles[variant], fullWidth ? styles.full : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
  return <button {...rest} type={type} class={classes} />;
}
