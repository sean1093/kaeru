import type { JSX } from 'preact';
import { type ContentCaveat, caveatFor } from '../../content/index.ts';
import type { ContentBlock } from '../../content/schema.ts';
import { useMessages } from '../../i18n/index.ts';
import styles from './Guide.module.css';
import { messages } from './messages.ts';

/**
 * Rendering a guide block.
 *
 * Content is structured data rather than HTML (`schema.ts`), so this is the only place
 * that decides what a `callout` or a `steps` block looks like — and the only place that
 * can get the caveat wrong.
 *
 * **The caveat renders with the block it qualifies, never collected at the top.** A
 * caveat is a property of a claim: an article that is mostly `confirmed-official` can
 * carry one paragraph resting on a bill that has not passed. Hoisting it would make a
 * reader discount the whole article; dropping it would render an unsettled figure exactly
 * like a settled one.
 */
export function ContentBlocks({
  blocks,
  articleStatus,
}: {
  blocks: readonly ContentBlock[];
  /** A block with no `status` of its own inherits this; only the exception is marked. */
  articleStatus: ContentBlock['status'];
}): JSX.Element {
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={`${block.kind}-${index}`} block={block} articleStatus={articleStatus} />
      ))}
    </>
  );
}

function Block({
  block,
  articleStatus,
}: {
  block: ContentBlock;
  articleStatus: ContentBlock['status'];
}): JSX.Element {
  const t = useMessages(messages);
  const status = block.status ?? articleStatus;
  const caveat = status === undefined ? null : caveatFor(status);

  return (
    <div class={block.kind === 'callout' ? styles[block.tone ?? 'info'] : styles.block}>
      {block.heading !== undefined && <h3 class={styles.blockHeading}>{block.heading}</h3>}
      {block.kind === 'steps' ? (
        <ol class={styles.steps}>
          {block.body.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      ) : block.kind === 'list' ? (
        <ul class={styles.bullets}>
          {block.body.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : block.kind === 'table' ? (
        <Table rows={block.rows ?? []} />
      ) : (
        block.body.map((line) => (
          <p key={line} class={styles.paragraph}>
            {line}
          </p>
        ))
      )}
      {caveat !== null && <Caveat caveat={caveat} label={t(`guide.caveat.${caveat}`)} />}
    </div>
  );
}

function Caveat({ caveat, label }: { caveat: ContentCaveat; label: string }): JSX.Element {
  return (
    <p class={styles.caveat} data-testid="content-caveat" data-caveat={caveat}>
      {label}
    </p>
  );
}

function Table({ rows }: { rows: readonly (readonly string[])[] }): JSX.Element {
  const [header, ...body] = rows;
  return (
    <div class={styles.tableScroll}>
      <table class={styles.table}>
        {header !== undefined && (
          <thead>
            <tr>
              {header.map((cell) => (
                <th key={cell} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={cell} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cell}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
