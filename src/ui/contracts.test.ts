import { describe, expect, it } from 'vitest';
import type { CardContractProps, ListRowProps } from './contracts.ts';

/**
 * These assert a compile-time guarantee, so the failure they are written for is a
 * `tsc` error rather than a red expectation: `@ts-expect-error` turns the absence of an
 * error into the failure. Without them the union is a constraint nothing exercises, and a
 * widening that quietly re-permits both props would pass every build — the same way a
 * filter that matched nothing passed every build until someone measured it.
 *
 * The `expect` calls are there so the suite reports a test; the assertion is the comment
 * above each one, enforced by the compiler.
 */
describe('a card is a link, a button, or neither — never two things at once', () => {
  it('accepts each of the three valid shapes', () => {
    const plain: CardContractProps = { title: 'This trip' };
    const link: CardContractProps = { title: 'Packing plan', href: '#/packing' };
    const button: CardContractProps = { title: 'Packing plan', onActivate: () => {} };
    expect([plain.title, link.href, typeof button.onActivate]).toEqual([
      'This trip',
      '#/packing',
      'function',
    ]);
  });

  it('refuses both activations at compile time', () => {
    // @ts-expect-error — a card with two destinations is two targets wearing one outline.
    const both: CardContractProps = {
      title: 'Packing plan',
      href: '#/packing',
      onActivate: () => {},
    };
    expect(both.href).toBe('#/packing');
  });
});

describe('a list row is a single announce unit, so it has one activation', () => {
  it('accepts each of the three valid shapes', () => {
    const display: ListRowProps = { primary: 'Matsumoto Kiyoshi' };
    const link: ListRowProps = { primary: 'Matsumoto Kiyoshi', href: '#/receipts/1' };
    const button: ListRowProps = { primary: 'Mei', onActivate: () => {} };
    expect([display.primary, link.href, typeof button.onActivate]).toEqual([
      'Matsumoto Kiyoshi',
      '#/receipts/1',
      'function',
    ]);
  });

  it('refuses both activations at compile time', () => {
    // @ts-expect-error — a row announced once cannot have two ways to activate it.
    const both: ListRowProps = {
      primary: 'Matsumoto Kiyoshi',
      href: '#/receipts/1',
      onActivate: () => {},
    };
    expect(both.href).toBe('#/receipts/1');
  });
});
