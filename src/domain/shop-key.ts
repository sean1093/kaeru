/**
 * Normalising a shop name into a grouping identity (`DR-012a`).
 *
 * Four steps, in this order: NFKC normalise so full-width and half-width forms collapse,
 * collapse internal whitespace, trim, and case-fold Latin text. NFKC runs first because it
 * turns an ideographic space into an ordinary one, which the whitespace step then absorbs.
 *
 * What it deliberately does **not** do is equate different scripts or branch names: 松本清,
 * マツキヨ and 松本清 新宿東口店 stay three distinct keys. Guessing that they are one shop
 * would be inventing a fact about a traveller's receipts. Grouping is therefore
 * best-effort, nothing downstream may treat it as authoritative, and the product carries
 * the two mitigations the rule requires — the form offers shops already used on this trip,
 * and the user can merge two groups by hand. A missed grouping only weakens an advisory
 * indicator; it can never produce a wrong refund figure.
 */
import type { ShopKeyOf } from './api.ts';

export const shopKeyOf: ShopKeyOf = (shopName) =>
  shopName.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();
