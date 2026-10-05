import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../domain/index.ts';
import { type KaeruDatabase, openDatabase } from './db.ts';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeSettings,
  saveSettings,
} from './settings-repository.ts';

let db: KaeruDatabase;
let counter = 0;

beforeEach(async () => {
  counter += 1;
  db = await openDatabase(`kaeru-settings-${counter}`, fixedClock('2026-10-05T00:00:00Z'));
});

afterEach(() => {
  db.close();
});

describe('loadSettings', () => {
  it('returns the caller-supplied fallback for a first-time visitor', async () => {
    expect(await loadSettings(db, { locale: 'en', theme: 'dark' })).toEqual({
      locale: 'en',
      theme: 'dark',
    });
  });

  it('defaults to Traditional Chinese and the system theme', async () => {
    expect(await loadSettings(db)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  it('merges a patch into the stored settings', async () => {
    await saveSettings(db, { locale: 'en' });
    expect(await saveSettings(db, { theme: 'dark' })).toEqual({ locale: 'en', theme: 'dark' });
    expect(await loadSettings(db)).toEqual({ locale: 'en', theme: 'dark' });
  });
});

describe('normalizeSettings', () => {
  it('drops values the app does not understand', () => {
    expect(normalizeSettings({ locale: 'zh-CN', theme: 'dark' }, DEFAULT_SETTINGS)).toEqual({
      locale: 'zh-TW',
      theme: 'dark',
    });
    expect(normalizeSettings(null, DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('corrupt', DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });
});
