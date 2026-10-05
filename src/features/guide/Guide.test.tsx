import { render, screen, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { getContent } from '../../content/index.ts';
import { setActiveLocale } from '../../i18n/index.ts';
import { ArticleScreen } from './ArticleScreen.tsx';
import { FaqScreen } from './FaqScreen.tsx';
import { GuideScreen } from './GuideScreen.tsx';

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
    // A caveat is a property of a claim. Hoisting it would make a reader discount the
    // whole article; dropping it would render an unsettled figure like a settled one.
    const withCaveat = getContent('zh-TW').articles.find((article) =>
      article.sections.some((section) =>
        section.blocks.some((block) => block.status !== undefined),
      ),
    );
    if (withCaveat === undefined) return;
    render(<ArticleScreen params={{ articleId: withCaveat.id }} />);
    const caveats = screen.getAllByTestId('content-caveat');
    expect(caveats.length).toBeGreaterThan(0);
    // It sits inside a section, not before the first one.
    expect(caveats[0]?.closest('section')).not.toBeNull();
  });

  it('says so rather than going blank when the article does not exist', () => {
    render(<ArticleScreen params={{ articleId: 'guide.nonexistent' }} />);
    expect(screen.getByText('找不到這篇')).toBeVisible();
    expect(screen.getByRole('link', { name: /回指南/ })).toBeVisible();
  });
});

describe('S54 — the FAQ', () => {
  it('renders every answer open, because the links into it are per entry', () => {
    // S2B's fee warning deep-links to one entry. An accordion would land that link on a
    // closed box.
    render(<FaqScreen params={{}} />);
    for (const entry of getContent('zh-TW').faq) {
      expect(screen.getByRole('heading', { level: 2, name: entry.question })).toBeVisible();
    }
  });

  it('highlights the entry it was deep-linked to without hiding its neighbours', () => {
    const entries = getContent('zh-TW').faq;
    const target = entries[1] ?? entries[0];
    if (target === undefined) return;
    render(<FaqScreen params={{ entryId: target.id }} />);
    expect(screen.getByTestId(`faq-${target.id}`)).toHaveAttribute('data-highlighted', 'true');
    // The questions either side are still on the page: someone who arrived from the fee
    // warning usually wants them too.
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBe(entries.length);
  });

  it('does not inherit an article caveat onto an answer that has none', () => {
    // An FAQ answer has no article to inherit from, so an unmarked block is unqualified
    // rather than silently carrying someone else's standing.
    const plain = getContent('zh-TW').faq.find((entry) =>
      entry.answer.every((block) => block.status === undefined),
    );
    if (plain === undefined) return;
    render(<FaqScreen params={{ entryId: plain.id }} />);
    const highlighted = screen.getByTestId(`faq-${plain.id}`);
    expect(within(highlighted).queryAllByTestId('content-caveat')).toEqual([]);
  });
});
