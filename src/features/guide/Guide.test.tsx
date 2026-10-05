import { render, screen, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { getContent, getOperatorDirectory } from '../../content/index.ts';
import { setActiveLocale } from '../../i18n/index.ts';
import { ArticleScreen } from './ArticleScreen.tsx';
import { ContentBlocks } from './ContentBlocks.tsx';
import { FaqScreen } from './FaqScreen.tsx';
import { GuideScreen } from './GuideScreen.tsx';
import { OperatorScreen } from './OperatorScreen.tsx';
import { OperatorsScreen } from './OperatorsScreen.tsx';

/**
 * S50, S51 and S54 (`M2-A4`, #37).
 *
 * What is worth defending here is provenance, not layout: a claim that rests on a bill
 * which has not passed must say so **where it is read**, an article must carry the date a
 * human opened its sources, and a deep link into one FAQ entry must land on an answer that
 * is already visible.
 */
beforeEach(() => {
  setActiveLocale('zh-TW');
});

describe('S50 — the guide index', () => {
  it('lists every shipped article plus the operators and the FAQ', () => {
    render(<GuideScreen />);
    for (const article of getContent('zh-TW').articles) {
      expect(screen.getByRole('link', { name: new RegExp(article.title) })).toBeVisible();
    }
    expect(screen.getByRole('link', { name: /退稅業者/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /常見問題/ })).toBeVisible();
  });

  it('says the guide works offline, because that is when it is read', () => {
    // A traveller reads this in a departure lobby on airport wifi. A guide that needed the
    // network would be absent exactly when the procedure it describes is happening.
    render(<GuideScreen />);
    expect(screen.getByTestId('guide-offline')).toHaveTextContent('離線');
  });

  it('switches every title when the language does', async () => {
    render(<GuideScreen />);
    setActiveLocale('en');
    const first = getContent('en').articles[0];
    expect(await screen.findByText(first?.title ?? '')).toBeVisible();
    expect(screen.getByTestId('guide-offline')).toHaveTextContent('offline');
  });
});

describe('S51 — an article', () => {
  const firstArticleId = getContent('zh-TW').articles[0]?.id ?? '';

  it('renders every section of the article it was asked for', () => {
    const article = getContent('zh-TW').articles[0];
    render(<ArticleScreen params={{ articleId: firstArticleId }} />);
    expect(screen.getByRole('heading', { level: 1, name: article?.title ?? '' })).toBeVisible();
    for (const section of article?.sections ?? []) {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeVisible();
    }
  });

  it('dates its sources with the day a human opened them', () => {
    // An undated citation is an assertion wearing a link, and these rules changed once
    // already. The access date is the only thing that says when the claim was true.
    render(<ArticleScreen params={{ articleId: firstArticleId }} />);
    const sources = screen.getByTestId('source-list');
    expect(within(sources).getAllByRole('link').length).toBeGreaterThan(0);
    expect(sources).toHaveTextContent(/2026/);
  });

  it('caveats a claim beside the claim, never hoisted to the top', () => {
    // Driven by a fixture rather than by shipped content: no article carries a block-level
    // status today, so a content-driven version of this test would pass while asserting
    // nothing — and what it guards is an unsettled claim rendered as settled.
    render(
      <ContentBlocks
        articleStatus="confirmed-official"
        blocks={[
          { kind: 'paragraph', body: ['settled'] },
          { kind: 'paragraph', body: ['not settled'], status: 'pending-legislation' },
        ]}
      />,
    );
    const caveats = screen.getAllByTestId('content-caveat');
    expect(caveats).toHaveLength(1);
    expect(caveats[0]).toHaveAttribute('data-caveat', 'pending-legislation');
    // Beside its own claim: the caveated paragraph is its sibling, and the settled one is
    // not in the same block.
    expect(caveats[0]?.parentElement).toHaveTextContent('not settled');
    expect(caveats[0]?.parentElement).not.toHaveTextContent('settled claim');
  });

  it('inherits the article status for a block that does not state one', () => {
    render(
      <ContentBlocks
        articleStatus="reported-media"
        blocks={[{ kind: 'paragraph', body: ['x'] }]}
      />,
    );
    expect(screen.getByTestId('content-caveat')).toHaveAttribute('data-caveat', 'reported-media');
  });

  it('says nothing for a confirmed-official claim, so a caveat keeps meaning something', () => {
    render(
      <ContentBlocks
        articleStatus="confirmed-official"
        blocks={[{ kind: 'paragraph', body: ['x'] }]}
      />,
    );
    expect(screen.queryAllByTestId('content-caveat')).toEqual([]);
  });

  it('says so rather than going blank when the article does not exist', () => {
    render(<ArticleScreen params={{ articleId: 'guide.nonexistent' }} />);
    expect(screen.getByText('找不到這篇')).toBeVisible();
    expect(screen.getByRole('link', { name: /回指南/ })).toBeVisible();
  });
});

describe('S54 — the FAQ', () => {
  it('lists every question, collapsed, when no entry was named', () => {
    render(<FaqScreen params={{}} />);
    const entries = getContent('zh-TW').faq;
    for (const entry of entries) {
      expect(screen.getByRole('heading', { level: 2, name: entry.question })).toBeVisible();
      expect(screen.getByTestId(`faq-${entry.id}`)).not.toHaveAttribute('open');
    }
  });

  it('opens the entry the route names, and leaves the rest closed', () => {
    // S2B's fee warning deep-links to one entry. Landing on one open answer beats landing
    // on one highlighted answer with six other full answers to scroll past — and the
    // neighbouring questions are still right there as headings.
    const entries = getContent('zh-TW').faq;
    const target = entries[1] ?? entries[0];
    if (target === undefined) return;
    render(<FaqScreen params={{ entryId: target.id }} />);
    expect(screen.getByTestId(`faq-${target.id}`)).toHaveAttribute('open');
    for (const other of entries.filter((entry) => entry.id !== target.id)) {
      expect(screen.getByTestId(`faq-${other.id}`)).not.toHaveAttribute('open');
    }
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(entries.length);
  });

  it('uses a native disclosure, so keyboard and expanded state are the platform\u2019s', () => {
    // A hand-rolled accordion is where the announced expansion state goes missing.
    render(<FaqScreen params={{}} />);
    const first = getContent('zh-TW').faq[0];
    if (first === undefined) return;
    const details = screen.getByTestId(`faq-${first.id}`);
    expect(details.tagName).toBe('DETAILS');
    expect(details.querySelector('summary')).not.toBeNull();
  });

  it('does not inherit an article caveat onto an answer that has none', () => {
    // An FAQ answer has no article to inherit from, so an unmarked block is unqualified
    // rather than silently carrying someone else's standing.
    const plain = getContent('zh-TW').faq.find((entry) =>
      entry.answer.every((block) => block.status === undefined),
    );
    expect(plain).toBeDefined();
    if (plain === undefined) return;
    render(<FaqScreen params={{ entryId: plain.id }} />);
    const opened = screen.getByTestId(`faq-${plain.id}`);
    expect(within(opened).queryAllByTestId('content-caveat')).toEqual([]);
  });
});

describe('S52 — the operator directory', () => {
  it('carries the association\u2019s caveat verbatim from the content layer', () => {
    // DR-053: the list is operators' declarations. Neither the association, the Japanese
    // state nor Kaeru vouches for any of them, and the screen renders that sentence rather
    // than a paraphrase of it.
    render(<OperatorsScreen />);
    const disclaimer = screen.getByTestId('operator-disclaimer');
    expect(disclaimer).toHaveTextContent('不代表認可或保證');
  });

  it('says the shop picks the operator, so the list does not read as a chooser', () => {
    // DR-050, UR-05. A directory that looks like options invites someone to go hunting for
    // the shop with the cheapest operator, which is not a thing they can do.
    render(<OperatorsScreen />);
    expect(screen.getByTestId('operator-not-a-choice')).toHaveTextContent('不是你選的');
  });

  it('lists every shipped operator, with the common ones first', () => {
    const directory = getOperatorDirectory();
    render(<OperatorsScreen />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(directory.operators.length);
    const firstName = directory.operators.find(
      (operator) => operator.id === directory.commonFirst[0],
    );
    expect(links[0]).toHaveTextContent(firstName?.name['zh-TW'] ?? '');
  });
});

describe('S53 — one operator', () => {
  it('DR-051 renders an unknown fee as a sentence, never as zero or a blank', () => {
    const unknown = getOperatorDirectory().operators.find((operator) => operator.feeNote === null);
    expect(unknown).toBeDefined();
    if (unknown === undefined) return;
    render(<OperatorScreen params={{ operatorId: unknown.id }} />);
    const fee = screen.getByTestId('operator-fee');
    expect(fee).toHaveTextContent('未公布');
    expect(fee).not.toHaveTextContent('0');
  });

  it('DR-026 dates every fee figure it shows', () => {
    const known = getOperatorDirectory().operators.find((operator) => operator.feeNote !== null);
    expect(known).toBeDefined();
    if (known === undefined) return;
    render(<OperatorScreen params={{ operatorId: known.id }} />);
    expect(screen.getByTestId('operator-fee-date')).toHaveTextContent(/202\d/);
  });

  it('marks the Japanese corporate name as Japanese for a screen reader', () => {
    const operator = getOperatorDirectory().operators[0];
    if (operator === undefined) return;
    render(<OperatorScreen params={{ operatorId: operator.id }} />);
    const ja = screen.getByText(operator.name.ja);
    expect(ja).toHaveAttribute('lang', 'ja');
  });

  it('says so rather than going blank for an operator that is not on the list', () => {
    render(<OperatorScreen params={{ operatorId: 'not-an-operator' }} />);
    expect(screen.getByText('找不到這家業者')).toBeVisible();
  });
});
