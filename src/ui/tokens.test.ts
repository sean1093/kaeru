import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `components.md`: "Every value below is a token from `tokens.css`. A component that
 * needs a raw hex, px, or duration is a bug in this document — report it rather than
 * inventing one." The same rule binds the implementation.
 *
 * `env()` and `0`/`0.xx` unitless numbers are not raw values — `--space-0: 0` and
 * easing curves have no token form. `url()` SVG data is exempt: it is markup, not a
 * styled length.
 *
 * `1px` and `2px` hairline widths (borders, outlines, the grabber/divider lines
 * `visual-language.md` describes only as "1 px") are exempt: the token set has no
 * `--border-width` scale, matching the existing M0 components (`Card.module.css`,
 * `Button.module.css`, `VisuallyHidden.module.css`). Anything above 2px must be a token.
 *
 * `6px`, `8px` and `10px` are exempt in the same way, for the three sizes
 * `components.md` section 8 states as literal pixels with no token equivalent: the
 * progress bar track ("Height | 6 px"), the step dots ("8 px"), and the current step
 * dot ("10 px"). The same two sizes cover the bottom-nav badge (section 2, "8 px dot").
 *
 * `3px` is exempt for the same reason: `components.md` section 13 states the banner's
 * accent-colour left border as "3 px" directly, like the other hairline widths above.
 */
const CSS_DIR = join(import.meta.dirname, '.');

function cssFiles(): readonly string[] {
  return readdirSync(CSS_DIR)
    .filter((name) => name.endsWith('.module.css'))
    .map((name) => join(CSS_DIR, name));
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const EXEMPT_PX = ['1px', '2px', '3px', '6px', '8px', '10px'];
const RAW_PX = new RegExp(
  `(?<![\\w-])-?(?!${EXEMPT_PX.map((v) => `${v}\\b`).join('|')})\\d*\\.?\\d+px`,
  'g',
);
const RAW_MS = /(?<![\w-])-?\d*\.?\d+m?s(?![a-zA-Z])/g;

describe('UI kit stylesheets reference tokens only (components.md, "every value is a token")', () => {
  for (const file of cssFiles()) {
    it(`${file.split('/').pop()} has no raw hex color`, () => {
      const css = readFileSync(file, 'utf8');
      expect(css.match(HEX)).toBeNull();
    });

    it(`${file.split('/').pop()} has no raw px length`, () => {
      const css = readFileSync(file, 'utf8');
      expect(css.match(RAW_PX)).toBeNull();
    });

    it(`${file.split('/').pop()} has no raw duration`, () => {
      const css = readFileSync(file, 'utf8');
      expect(css.match(RAW_MS)).toBeNull();
    });
  }

  it('found at least one stylesheet to check', () => {
    expect(cssFiles().length).toBeGreaterThan(0);
  });
});
