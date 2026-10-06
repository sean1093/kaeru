/**
 * Guardrails: the rules that are prohibitions rather than features.
 *
 * `DR-013` says a vocabulary must not exist. `DR-040`, `DR-044` and `DR-052` say the app
 * must not talk to a network it does not own. `DR-075` and `DR-078` say a finding must
 * never block a save. There is nothing to build for any of them, so there is nothing a
 * behavioural test can observe — and nothing stopping a later pull request from quietly
 * violating one.
 *
 * This is the **one** exception to "assert observable output, never implementation"
 * (`test-strategy.md` section 3). That rule exists to stop tests pinning wording in place
 * of behaviour; a prohibition has no behaviour to pin, static assertion is the only
 * mechanism available, and the thing protected is a published contract in
 * `domain-rules.md` rather than an implementation detail. **Nobody may cite the general
 * rule to delete this suite.**
 *
 * Every guardrail here names the rule id it protects in its title, asserts a prohibition
 * or an equality and never a quality judgement, makes no wall-clock assertion, and keeps
 * its exceptions in an explicit allowlist a reviewer can argue with.
 *
 * **When one of these fires on something legitimate**: name the value in the rules
 * document, or add it to the allowlist below with a reason. Never loosen a pattern. A
 * guard relaxed on first contact protects nothing.
 *
 * ---
 *
 * ## What this suite does not cover
 *
 * Two lists, deliberately separate, because they decay differently. Collapsed into one,
 * the un-checkable rules make the gap look permanent and the gap makes the un-checkable
 * rules look like laziness — and in six months nobody can tell which is which.
 *
 * ### List A — not machine-checkable, and never will be. Checked in review instead.
 *
 * | Rule | Why | Where it is checked |
 * |---|---|---|
 * | `UR-04` never state or imply a red-result probability | the violation is a sentence, not a token: "most travellers get green" contains nothing greppable | content review, QA manual pass |
 * | `UR-06` never promise airport cash | needs reading: the gap between "cash may be available" and "you can get cash" is tone | content review |
 * | `UR-10` a traveller may decline to claim without being nagged | behavioural, and nagging is a pattern across screens rather than a string | UX review, QA journey pass |
 *
 * ### List B — checkable, just not written yet. A gap someone can close.
 *
 * | Rule | The scan |
 * |---|---|
 * | `DR-008` Kaeru never verifies eligibility | same shape as the `DR-080` assertion here: no blocking finding may cite `DR-005`–`DR-008` |
 *
 * Membership of list A is a claim about the world and not a fact: a rule moves to list B
 * the moment someone sees a scan for it. `DR-008` moved that way during review.
 */
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '../app/screens.ts';
import { getContent } from '../content/index.ts';
import { kaeruRules, resolveRules } from '../domain/index.ts';
import type { Locale } from '../i18n/index.ts';
import { FORBIDDEN_CONSTANTS } from './constants.ts';
import { GUARDED_DIRECTORIES, productDirectories, readSources, readSpecs } from './sources.ts';

const SOURCES = readSources();
const SPECS = readSpecs();
const LOCALES: readonly Locale[] = ['zh-TW', 'en'];
const rules = resolveRules(kaeruRules, kaeruRules.system.refundSystemStart);

function contentText(locale: Locale): string {
  const bundle = getContent(locale);
  return JSON.stringify([bundle.articles, bundle.faq, bundle.operatorNotes]);
}

/**
 * Files matching `pattern` that are not allowed to.
 *
 * An allowlist key naming a file exempts that file. A key ending in `/` exempts a
 * directory, which is reserved for the case where the whole directory is a different kind
 * of thing — not as a way to silence several files at once.
 */
function offenders(
  pattern: RegExp,
  allowed: Readonly<Record<string, string>>,
  read: (file: (typeof SOURCES)[number]) => string = (file) => file.code,
): readonly string[] {
  const exempt = (name: string): boolean =>
    name in allowed ||
    Object.keys(allowed).some((key) => key.endsWith('/') && name.startsWith(key));
  return SOURCES.filter((file) => !exempt(file.name) && pattern.test(read(file))).map(
    (file) => file.name,
  );
}

/**
 * The pattern tables, at module scope so the positive controls below test **the same
 * objects** the guardrails use. A control that re-declares a copy of the pattern proves
 * only that the copy works, which is the drift this suite exists to prevent.
 */
const NETWORK = [
  { api: 'fetch', pattern: /\bfetch\s*\(/, fixture: 'await fetch(url)' },
  { api: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/, fixture: 'new XMLHttpRequest()' },
  { api: 'WebSocket', pattern: /\bnew\s+WebSocket\b/, fixture: 'new WebSocket(url)' },
  { api: 'sendBeacon', pattern: /\bsendBeacon\s*\(/, fixture: 'navigator.sendBeacon(u, d)' },
  { api: 'EventSource', pattern: /\bnew\s+EventSource\b/, fixture: 'new EventSource(url)' },
] as const;

const CREDENTIAL = {
  pattern: /\b(password|apiKey|accessToken|refreshToken|secret|credential)s?\b/i,
  fixture: 'interface Session { accessToken: string }',
} as const;

const PASSPORT = {
  pattern: /passportNumber|fullPassport/i,
  fixture: 'interface Traveler { passportNumber: string }',
} as const;

const DIALOGS = [
  { api: 'window.confirm', pattern: /\bconfirm\s*\(/, fixture: 'if (confirm("sure?"))' },
  { api: 'window.alert', pattern: /(?<![.\w])alert\s*\(/, fixture: 'alert("saved")' },
  { api: 'window.prompt', pattern: /(?<![.\w])prompt\s*\(/, fixture: 'prompt("name?")' },
  {
    api: 'beforeunload',
    pattern: /\bbeforeunload\b/,
    fixture: "addEventListener('beforeunload', warn)",
  },
] as const;

const ROUTER = [
  {
    what: 'a hash assignment',
    pattern: /location\.hash\s*=/,
    fixture: "window.location.hash = '#/receipts';",
  },
  { what: 'an internal link literal', pattern: /['"`]#\/[a-z]/i, fixture: 'href="#/receipts"' },
] as const;

const DEV_ROUTE = {
  /** A route declared under `/dev/`, which the registry exempts from the inventory checks. */
  pattern: /pattern:\s*['"`]\/dev\//,
  fixture: "routes: [{ pattern: '/dev/tools', screenIds: [] }]",
} as const;

const DEV_GATE = /import\.meta\.env\.DEV/;

const ABOLISHED_PROSE = ['一般物品', '消耗品', 'general goods', 'consumables'] as const;

const ABOLISHED_IDENTIFIERS = [
  /\bgoodsCategory\b/,
  /\bGoodsCategory\b/,
  /\bgeneralGoods\b/,
  /\bconsumableGoods\b/,
  /['"`]consumable['"`]/,
] as const;

const ELIGIBILITY_RULES = ['DR-005', 'DR-006', 'DR-007'] as const;

const BLOCKING_ADVISORY = {
  pattern: (rule: string) => new RegExp(`'${rule}',\\s*'block'`),
  fixture: "finding('DR-076a', 'block', 'x')",
} as const;

describe('guardrails: the suite can see the code it guards', () => {
  it('reads every product module under src', () => {
    expect(SOURCES.length).toBeGreaterThan(30);
  });

  it('guards every product directory, so a new one cannot appear unwatched', () => {
    // A directory added under src/ and not listed in GUARDED_DIRECTORIES would be silently
    // outside every rule below — the one failure a guardrail suite cannot afford.
    expect(productDirectories()).toEqual([...GUARDED_DIRECTORIES].sort());
  });

  it('reads the end-to-end specs, for the fixme gate', () => {
    expect(SPECS.length).toBeGreaterThan(0);
  });
});

describe('guardrails: every matcher is demonstrated to fire (positive controls)', () => {
  /**
   * **A pattern that matches nothing is indistinguishable from a codebase that is clean.**
   *
   * Every assertion below this block says "no file matched". That sentence is worthless
   * unless the matcher is capable of matching, and nothing about a green run distinguishes
   * *the rule is honoured* from *the rule was never expressible*. This suite's own first
   * draft of `DR-013` was CJK-only and would have passed for ever against a codebase that
   * modelled the abolished split in English.
   *
   * So each prohibition is run against a fixture that must be caught. These are string
   * literals rather than files on disk: the matchers are pure, and a fixture file would add
   * a thing someone has to remember not to delete.
   *
   * This is the same rule the suite applies to the product — a check that can only pass is
   * the same defect as a constant that never changes — turned on the suite itself. Without
   * it the guardrails are the reassuring default applied to the thing whose entire job is
   * to prevent the reassuring default: green, plausible, and silent about whether they are
   * capable of being otherwise.
   */
  /** A known violation per rule constant, which its pattern must catch. */
  const FIXTURES: Readonly<Record<string, string>> = {
    'DR-010': 'if (total >= 5000) claim();',
    'DR-016': 'const highValue = 1_000_000;',
    'DR-027': 'const feeFloor = 2000;',
    'DR-031': 'addDays(purchase, 90)',
    'DR-023': 'const rate = 0.1;',
    'DR-001': "const start = '2026-11-01';",
  };

  const CONTROLS: readonly { rule: string; pattern: RegExp; fixture: string }[] = [
    ...FORBIDDEN_CONSTANTS.map((entry) => ({
      rule: entry.rule,
      pattern: entry.pattern,
      fixture: FIXTURES[entry.rule] ?? '',
    })),
    ...NETWORK.map((entry) => ({ rule: `DR-040 ${entry.api}`, ...entry })),
    { rule: 'DR-044', ...CREDENTIAL },
    { rule: 'DR-041', ...PASSPORT },
    ...DIALOGS.map((entry) => ({ rule: `TC-I18N-015 ${entry.api}`, ...entry })),
    ...ROUTER.map((entry) => ({ rule: `M1-5a ${entry.what}`, ...entry })),
  ];

  it('has a fixture for every constant in the shared list', () => {
    // A new FORBIDDEN_CONSTANTS entry without a fixture would be an unproven matcher
    // arriving with the appearance of coverage.
    expect(
      FORBIDDEN_CONSTANTS.map((entry) => entry.rule).filter((rule) => !(rule in FIXTURES)),
    ).toEqual([]);
  });

  for (const { rule, pattern, fixture } of CONTROLS) {
    it(`${rule}: the matcher catches ${fixture}`, () => {
      expect(
        pattern.test(fixture),
        `${rule}'s pattern does not match a known violation, so "no offenders" means nothing`,
      ).toBe(true);
    });
  }

  it('DR-013: the matchers catch both the prose and the type that never spells it out', () => {
    expect(ABOLISHED_PROSE.some((word) => 'const label = "general goods";'.includes(word))).toBe(
      true,
    );
    // The likeliest real violation, which the prose list alone misses entirely: a model of
    // the dead distinction that never writes either phrase out.
    const asType = "type GoodsCategory = 'general' | 'consumable';";
    expect(ABOLISHED_PROSE.some((word) => asType.includes(word))).toBe(false);
    expect(ABOLISHED_IDENTIFIERS.some((pattern) => pattern.test(asType))).toBe(true);
  });

  it('M1-5a: the matcher catches a /dev/ route, and the gate matcher catches its gate', () => {
    // Nothing on `main` declares a `/dev/` route yet, so without this the guardrail above
    // would pass by having nothing to look at — green, plausible, and incapable of failing.
    expect(DEV_ROUTE.pattern.test(DEV_ROUTE.fixture)).toBe(true);
    expect(
      DEV_GATE.test('export const feature = import.meta.env.DEV ? defineFeature({}) : undefined;'),
    ).toBe(true);
    expect(DEV_GATE.test('export const feature = defineFeature({});')).toBe(false);
  });

  it('DR-008: the matcher catches an eligibility rule cited in a finding', () => {
    const fixture = "finding('DR-005', 'warn', 'validation.looksIneligible')";
    expect(ELIGIBILITY_RULES.some((rule) => new RegExp(`'${rule}'`).test(fixture))).toBe(true);
  });

  it('DR-080: the matcher catches an advisory rule raised as a blocker', () => {
    expect(/'DR-076a',\s*'block'/.test("finding('DR-076a', 'block', 'x')")).toBe(true);
  });
});

describe('guardrails: rule constants live in the rules document (DR-022, R19)', () => {
  /**
   * Each entry is a value this pattern may legitimately match, with the reason. Adding one
   * is a visible diff a reviewer can argue with; loosening a pattern is not.
   */
  const ALLOWED: Readonly<Record<string, string>> = {
    'domain/rules-data.ts': 'the rules document itself, which is where every one belongs',
    'content/guide.zh-TW.ts':
      'prose states the rules on purpose; the drift guardrail below checks it',
    'content/guide.en.ts': 'as above',
    'content/faq.zh-TW.ts': 'as above',
    'content/faq.en.ts': 'as above',
    'content/operator-notes.zh-TW.ts': 'operator fee figures are sourced facts, not rules data',
    'content/operator-notes.en.ts': 'as above',
    'content/operators.ts': 'fee basis points and observation dates are operator facts (DR-026a)',
    'content/sources.ts': 'every source carries its access date',
    'content/seeds.ts': 'sample data is written to look like a real trip',
    'data/test-builders.ts':
      'test scaffolding, not product code — belongs under src/test-support/, tracked separately',
    'ui/Toast.tsx':
      'a five-second dismissal timeout is a duration in milliseconds, not the yen threshold',
    'features/settings/index.ts':
      'a tab order of 90 is a position in a list, not the 90-day export window',
    'features/gallery/copy.ts':
      'a sample deadline hint in demo copy for the DateField specimen, not the export window',
    'features/gallery/sections/forms.tsx':
      "a sample start date for the DateField specimen's demo state, not an effective date",
  };

  for (const { rule, what, pattern } of FORBIDDEN_CONSTANTS) {
    it(`${rule} keeps ${what} out of every module that is not the rules document`, () => {
      expect(offenders(pattern, ALLOWED).map((name) => `${name} (${rule}: ${what})`)).toEqual([]);
    });
  }
});

describe('guardrails: the content and the rules data cannot drift (R19)', () => {
  /**
   * The numbers that exist in **both** the rules data and the guide prose.
   *
   * Deliberately an allowlist of linked numbers rather than a blanket "never restate a
   * number", which would not survive bilingual prose: 「未稅金額滿 5,000 日圓」 and "¥5,000 or
   * more before tax" place the figure differently, and most numbers in the guide — the
   * NT$200–400 band, operator fee schedules, the 2025-03-31 別送 abolition — are sourced
   * facts that are not rules data and never can be. Adding a fourth is a deliberate act.
   */
  const LINKED = [
    {
      rule: 'DR-010',
      what: 'the tax-excluded threshold',
      value: () => rules.threshold.minTaxExcludedJpy,
      forms: (value: number) => [value.toLocaleString('en-US'), String(value)],
    },
    {
      rule: 'DR-031',
      what: 'the export window in days',
      value: () => rules.deadline.exportWindowDays,
      forms: (value: number) => [String(value)],
    },
    {
      rule: 'DR-001',
      what: 'the year the refund system starts',
      value: () => Number(kaeruRules.system.refundSystemStart.slice(0, 4)),
      forms: (value: number) => [String(value)],
    },
  ];

  it('keeps the linked list to the three numbers that are genuinely in both places', () => {
    expect(LINKED.map((entry) => entry.rule)).toEqual(['DR-010', 'DR-031', 'DR-001']);
  });

  for (const { rule, what, value, forms } of LINKED) {
    for (const locale of LOCALES) {
      it(`${rule} states ${what} in the ${locale} content as the rules data has it`, () => {
        const written = forms(value());
        expect(
          written.some((form) => contentText(locale).includes(form)),
          `src/domain/rules-data.ts has ${rule} as ${value()}, and no form of it (${written.join(', ')}) appears in the ${locale} content. Change the content or the rules data — they cannot disagree.`,
        ).toBe(true);
      });
    }
  }
});

describe('guardrails: the abolished category vocabulary does not exist (DR-013)', () => {
  /**
   * From 2026-11-01 there is one combined total. The words may appear only where the
   * content says the distinction is gone.
   *
   * **Prose forms and identifier forms are both banned, because they fail differently.**
   * The first draft of this scan was CJK-only and would have passed green against a
   * codebase that modelled the abolished split in English throughout; the prose forms
   * added next still miss the most probable violation in a TypeScript file, which is
   * `type GoodsCategory = 'general' | 'consumable'` — a model of the dead distinction
   * that never writes either phrase out. A scan that cannot see the likeliest shape of
   * the violation is the reassuring default pointed at our own guardrails.
   */
  it('DR-013 keeps the general-goods / consumables split out of every module', () => {
    const found = SOURCES.filter(
      (file) =>
        !file.name.startsWith('content/') &&
        ABOLISHED_PROSE.some((word) => file.raw.includes(word)),
    ).map((file) => file.name);
    expect(found).toEqual([]);
  });

  it('DR-013 keeps the split out of the type system too, where it would not be spelled out', () => {
    const found = SOURCES.filter((file) =>
      ABOLISHED_IDENTIFIERS.some((pattern) => pattern.test(file.code)),
    ).map((file) => file.name);
    expect(found).toEqual([]);
  });

  it('DR-013 lets the content use the words only to say they are abolished', () => {
    const saysAbolished = ['取消', 'is gone', 'are gone', 'no longer', 'abolished', '不再'];
    for (const locale of LOCALES) {
      const text = contentText(locale);
      for (const word of ABOLISHED_PROSE) {
        if (!text.includes(word)) continue;
        expect(
          saysAbolished.some((phrase) => text.includes(phrase)),
          `"${word}" appears in the ${locale} content without saying the distinction is abolished`,
        ).toBe(true);
      }
    }
  });
});

describe('guardrails: the app talks to nobody (DR-040, DR-044, DR-052)', () => {
  const ALLOWED: Readonly<Record<string, string>> = {
    'app/update-state.ts':
      'registers the service worker, which fetches our own build and nothing else',
  };

  for (const { api, pattern } of NETWORK) {
    it(`DR-040 keeps ${api} out of the app: all data stays on the device`, () => {
      expect(offenders(pattern, ALLOWED)).toEqual([]);
    });
  }

  it('DR-044 declares no credential field on any entity', () => {
    expect(offenders(CREDENTIAL.pattern, {})).toEqual([]);
  });
});

describe('guardrails: validation informs rather than blocks (DR-075, DR-078, DR-080)', () => {
  const NEVER_BLOCKS = ['DR-073', 'DR-074', 'DR-075', 'DR-076', 'DR-076a', 'DR-077', 'DR-078'];

  it('raises no finding at all for an eligibility rule (DR-008)', () => {
    // DR-008: "Kaeru does not verify eligibility. It informs; the shop decides." Not merely
    // "never blocks" — a warning that a traveller looks ineligible is still Kaeru deciding,
    // and the shop is the only party that can. So the ban is on the rule appearing in a
    // finding at any severity, which is stronger than the DR-080 check below.
    const validation = SOURCES.filter((file) => file.name.startsWith('domain/validation'));
    expect(validation.length).toBeGreaterThan(0);
    const cited = ELIGIBILITY_RULES.filter((rule) =>
      validation.some((file) => new RegExp(`'${rule}'`).test(file.code)),
    );
    expect(cited, 'DR-008: Kaeru informs, the shop decides').toEqual([]);
  });

  it('raises no blocking finding for an advisory rule', () => {
    const validation = SOURCES.filter((file) => file.name.startsWith('domain/validation'));
    expect(validation.length).toBeGreaterThan(0);
    const blocking = NEVER_BLOCKS.filter((rule) =>
      validation.some((file) => BLOCKING_ADVISORY.pattern(rule).test(file.code)),
    );
    expect(blocking, 'DR-080: validation informs, it never blocks what the law permits').toEqual(
      [],
    );
  });
});

describe('guardrails: no entity can hold a passport number (DR-041)', () => {
  const ALLOWED: Readonly<Record<string, string>> = {
    'data/backup.ts':
      'holds the import-side rejector, which is the code that enforces DR-041 rather than violating it',
  };

  it('DR-041 names no full passport anywhere a record could carry one', () => {
    expect(offenders(PASSPORT.pattern, ALLOWED)).toEqual([]);
  });
});

describe('guardrails: no native browser dialog (TC-I18N-015)', () => {
  /**
   * A native dialog renders its buttons in the **OS** language, so a zh-TW user sees
   * "Leave site? / OK / Cancel" in English whatever the app locale. It is the one surface
   * the i18n layer cannot reach, which makes "never" the only enforceable rule.
   *
   * Scanned over `code` rather than `raw`, so `router.ts`'s two comments explaining why
   * `window.confirm` is absent do not become the first false positive.
   */
  for (const { api, pattern } of DIALOGS) {
    it(`uses no ${api}: its buttons are in the OS language, not the app's`, () => {
      expect(offenders(pattern, {})).toEqual([]);
    });
  }
});

describe('guardrails: the router owns navigation (M1-5a)', () => {
  const ROUTER_ONLY: Readonly<Record<string, string>> = {
    'app/router.ts': 'the router is the one module that may write the address bar',
  };

  it('assigns window.location.hash nowhere but the router', () => {
    expect(offenders(ROUTER[0].pattern, ROUTER_ONLY)).toEqual([]);
  });

  it('builds internal links with pathTo, never a hash string literal', () => {
    // `href="#/receipts"` bypasses the typed inventory, so a renamed route leaves a dead
    // link that compiles. `screens.ts` and the router own the one place a path is spelled.
    const allowed: Readonly<Record<string, string>> = {
      'app/router.ts': 'parses and formats hashes by definition',
      'app/screens.ts': 'the published inventory: this is where patterns are spelled',
      // A directory exemption, and the only one. The gallery renders specimens of
      // link-bearing components, so its hrefs are fixture data for a component under
      // glass rather than navigation a traveller can follow: a dead one is a wrong
      // specimen, not a wrong app. It is also `import.meta.env.DEV`-gated and absent
      // from the production bundle, which `e2e/production-bundle.spec.ts` asserts.
      'features/gallery/': 'specimen fixtures, dev-only, never reachable in production',
    };
    expect(offenders(ROUTER[1].pattern, allowed)).toEqual([]);
  });

  it('gates every /dev/ route behind import.meta.env.DEV', () => {
    // The registry exempts a `/dev/`-prefixed pattern from the inventory, chrome, location
    // and sheet checks, and the prefix is the whole test — any feature can claim it. The
    // only thing keeping an exempt route out of the production bundle is that the module
    // declaring it is DEV-gated, and nothing checks that. A prohibition with no runtime
    // surface, which is what this suite is for.
    const ungated = SOURCES.filter(
      (file) => DEV_ROUTE.pattern.test(file.code) && !DEV_GATE.test(file.code),
    ).map((file) => file.name);
    expect(
      ungated,
      'a /dev/ route in a module that ships is an unlisted screen in the production bundle',
    ).toEqual([]);
  });

  it('writes data-screen only through screenAttrs, with a published id', () => {
    const published = new Set<string>(SCREEN_IDS);
    const written = SOURCES.flatMap((file) =>
      [...file.code.matchAll(/data-screen=['"]([^'"]+)['"]/g)].map((match) => ({
        file: file.name,
        id: match[1] ?? '',
      })),
    );
    const unpublished = written.filter((entry) => !published.has(entry.id));
    expect(
      unpublished,
      'a data-screen value outside the inventory is a screen QA cannot find',
    ).toEqual([]);
  });
});

describe('guardrails: no end-to-end case is left switched off by accident (M3-2)', () => {
  /**
   * `test.fixme` is how a case written ahead of its screen stays visible in every CI report
   * rather than invisible on a branch. The risk is that one survives its feature: a disabled
   * case reads as coverage while asserting nothing.
   *
   * **Pinned by enabling issue, not by count.** A count would be the wrong unit: each
   * `test.fixme(true, …)` here sits at the top of a `describe` and disables every case
   * inside it, so "5 fixmes" is five *statements* covering far more than five cases, and the
   * number would stay 5 while the cases beneath them doubled. The issue that turns each one
   * on is the thing that must not change silently.
   *
   * `M3-2` requires this map to be **empty** before release — `test-strategy.md` section 6.
   */
  const EXPECTED_FIXMES: Readonly<Record<string, readonly string[]>> = {
    'airport.spec.ts': ['#48', '#48', '#49', '#50', '#51'],
    'onboarding-settings-guide.spec.ts': ['#34', '#34', '#35', '#37', '#38'],
  };

  function issuesIn(code: string): readonly string[] {
    return [...code.matchAll(/\btest\.fixme\s*\(([^)]*)\)/g)]
      .map((match) => match[1]?.match(/#\d+/)?.[0] ?? '(no issue named)')
      .sort();
  }

  it('disables a case only where an issue is named to turn it on', () => {
    const actual: Record<string, readonly string[]> = {};
    for (const spec of SPECS) {
      const issues = issuesIn(spec.code);
      if (issues.length > 0) actual[spec.name] = issues;
    }
    expect(actual).toEqual(
      Object.fromEntries(
        Object.entries(EXPECTED_FIXMES).map(([file, issues]) => [file, [...issues].sort()]),
      ),
    );
  });

  it('names the enabling issue on every fixme, so turning it on is someones work', () => {
    const unexplained = SPECS.flatMap((spec) =>
      issuesIn(spec.code)
        .filter((issue) => issue === '(no issue named)')
        .map(() => spec.name),
    );
    expect(unexplained).toEqual([]);
  });

  it('switches a case off through fixme alone, never through a quieter form', () => {
    // `describe.fixme` and an unconditional `test.skip` disable cases too, and neither shows
    // up in the pinned map above. A gate that watches one spelling of a thing teaches people
    // the other spellings.
    const quiet = SPECS.flatMap((spec) =>
      [...spec.code.matchAll(/\b(?:test|describe)\.describe\.fixme|\.skip\s*\(\s*true\b/g)].map(
        (match) => `${spec.name}: ${match[0]}`,
      ),
    );
    expect(quiet).toEqual([]);
  });
});
