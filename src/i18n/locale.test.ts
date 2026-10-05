import { describe, expect, it } from 'vitest';
import { setActiveLocale } from './active-locale.ts';
import { defineMessages, translate } from './bundle.ts';
import { formatCurrency, formatDate, formatNumber } from './format.ts';
import { isLocale, negotiateLocale } from './locale.ts';

describe('negotiateLocale', () => {
  it('maps Traditional Chinese variants to zh-TW', () => {
    expect(negotiateLocale(['zh-TW'])).toBe('zh-TW');
    expect(negotiateLocale(['zh-Hant-HK', 'en-US'])).toBe('zh-TW');
    expect(negotiateLocale(['zh'])).toBe('zh-TW');
  });

  it('does not serve Traditional Chinese to Simplified Chinese readers', () => {
    expect(negotiateLocale(['zh-CN', 'en-GB'])).toBe('en');
    expect(negotiateLocale(['zh-Hans-CN', 'ja'])).toBe('zh-TW');
  });

  it('falls back when nothing matches', () => {
    expect(negotiateLocale(['ja-JP', 'ko'])).toBe('zh-TW');
    expect(negotiateLocale([], 'en')).toBe('en');
  });

  it('recognises only supported locales', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('zh-CN')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe('setActiveLocale', () => {
  it('persists the choice so the next cold start opens in the same language', () => {
    setActiveLocale('en');
    expect(localStorage.getItem('kaeru.locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    setActiveLocale('zh-TW');
    expect(document.documentElement.lang).toBe('zh-Hant-TW');
  });
});

describe('translate', () => {
  const bundle = defineMessages({
    'zh-TW': { greet: '你好，{name}', plain: '純文字' },
    en: { greet: 'Hello, {name}', plain: 'Plain' },
  });

  it('substitutes placeholders', () => {
    expect(translate(bundle, 'en', 'greet', { name: 'Mei' })).toBe('Hello, Mei');
    expect(translate(bundle, 'zh-TW', 'greet', { name: '小美' })).toBe('你好，小美');
  });

  it('leaves an unknown placeholder visible rather than printing undefined', () => {
    expect(translate(bundle, 'en', 'greet')).toBe('Hello, {name}');
    expect(translate(bundle, 'en', 'greet', { other: 1 })).toBe('Hello, {name}');
  });

  it('returns plain messages untouched', () => {
    expect(translate(bundle, 'en', 'plain', { unused: 1 })).toBe('Plain');
  });
});

describe('Intl formatting', () => {
  it('formats yen without decimals in both locales', () => {
    expect(formatCurrency('en', 5000)).toBe('¥5,000');
    expect(formatCurrency('zh-TW', 5000)).toBe('¥5,000');
    expect(formatCurrency('en', 5500)).not.toContain('.');
  });

  it('keeps minor units for currencies that have them', () => {
    expect(formatCurrency('en', 12.5, 'USD')).toBe('$12.50');
  });

  it('groups large numbers', () => {
    expect(formatNumber('en', 9_999_999)).toBe('9,999,999');
  });

  it('formats a calendar date in the local convention without shifting the day', () => {
    expect(formatDate('en', '2026-11-01')).toBe('Nov 1, 2026');
    expect(formatDate('zh-TW', '2026-11-01')).toBe('2026年11月1日');
  });
});
