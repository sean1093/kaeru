import type { JSX } from 'preact';
import { useMessages } from '../../../i18n/index.ts';
import type { ChipStatus } from '../../../ui/contracts.ts';
import {
  AppBar,
  Button,
  Card,
  EmptyState,
  FrogMarkIcon,
  List,
  ListRow,
  ReceiptIcon,
  StatusChip,
} from '../../../ui/index.ts';
import { galleryCopy } from '../copy.ts';
import styles from '../Gallery.module.css';
import { GallerySection, Specimen } from '../Specimen.tsx';

const noop = () => {};

/** `components.md` sections 1, 3, 4, 5, 6 and 14 — the structural kit (M1-3a, #23). */
export function CoreSection(): JSX.Element {
  const t = useMessages(galleryCopy);

  const chips: readonly [ChipStatus, string][] = [
    ['logged', t('gallery.chip.logged')],
    ['registered', t('gallery.chip.registered')],
    ['customs_confirmed', t('gallery.chip.customsConfirmed')],
    ['refund_pending', t('gallery.chip.refundPending')],
    ['refunded', t('gallery.chip.refunded')],
    ['rejected', t('gallery.chip.rejected')],
    ['refund_disputed', t('gallery.chip.refundDisputed')],
    ['not_claiming', t('gallery.chip.notClaiming')],
    ['needs_action', t('gallery.chip.needsAction')],
    ['operator_unknown', t('gallery.chip.operatorUnknown')],
  ];

  return (
    <>
      <GallerySection id="app-bar" title={t('gallery.section.appBar')}>
        <Specimen id="app-bar-flat" state="leading: none, action: none">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <AppBar title={t('gallery.appBar.screenTitle')} />
          </div>
        </Specimen>
        <Specimen id="app-bar-back-action" state="leading: back, action: icon, elevated: false">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <AppBar
              title={t('gallery.appBar.screenTitle')}
              leading={{ kind: 'back', label: t('gallery.appBar.back'), onActivate: noop }}
              action={{ icon: ReceiptIcon, label: t('gallery.appBar.add'), onActivate: noop }}
            />
          </div>
        </Specimen>
        <Specimen id="app-bar-elevated" state="elevated: true">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <AppBar
              title={t('gallery.appBar.screenTitle')}
              elevated
              leading={{ kind: 'back', label: t('gallery.appBar.back'), onActivate: noop }}
            />
          </div>
        </Specimen>
        <Specimen id="app-bar-modal" state="leading: close">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <AppBar
              title={t('gallery.appBar.screenTitle')}
              leading={{ kind: 'close', label: t('gallery.appBar.close'), onActivate: noop }}
            />
          </div>
        </Specimen>
        <Specimen id="app-bar-long-title" state="title: two lines, then clipped">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <AppBar
              title={t('gallery.appBar.longTitle')}
              leading={{ kind: 'back', label: t('gallery.appBar.back'), onActivate: noop }}
              action={{ icon: ReceiptIcon, label: t('gallery.appBar.add'), onActivate: noop }}
            />
          </div>
        </Specimen>
      </GallerySection>

      <GallerySection id="button" title={t('gallery.section.button')}>
        <Specimen id="button-primary" state='variant: "primary", fullWidth'>
          <Button variant="primary" fullWidth class={styles.stretch}>
            {t('gallery.button.save')}
          </Button>
        </Specimen>
        <Specimen id="button-secondary" state='variant: "secondary"'>
          <Button variant="secondary">{t('gallery.button.import')}</Button>
        </Specimen>
        <Specimen id="button-quiet" state='variant: "quiet", size: "inline"'>
          <Button variant="quiet" size="inline">
            {t('gallery.button.guide')}
          </Button>
        </Specimen>
        <Specimen id="button-destructive" state='variant: "destructive", fullWidth'>
          <Button variant="destructive" fullWidth class={styles.stretch}>
            {t('gallery.button.deleteAll')}
          </Button>
        </Specimen>
        <Specimen id="button-airport" state='size: "airport" (56 px)'>
          <Button variant="primary" size="airport" fullWidth class={styles.stretch}>
            {t('gallery.button.next')}
          </Button>
        </Specimen>
        <Specimen id="button-inactive" state="inactive: true (focusable, reason adjacent)">
          <Button variant="primary" inactive fullWidth class={styles.stretch}>
            {t('gallery.button.next')}
          </Button>
          <p class={styles.intro}>{t('gallery.button.inactiveReason')}</p>
        </Specimen>
      </GallerySection>

      <GallerySection id="card" title={t('gallery.section.card')}>
        <Specimen id="card-plain" state="title + children">
          <div class={styles.stretch}>
            <Card title={t('gallery.card.title')}>
              <p class={styles.intro}>{t('gallery.card.body')}</p>
            </Card>
          </div>
        </Specimen>
        <Specimen id="card-tappable" state="href: whole card is one target">
          <div class={styles.stretch}>
            <Card title={t('gallery.card.linkTitle')} href="#/dev/gallery">
              <p class={styles.intro}>{t('gallery.card.linkBody')}</p>
            </Card>
          </div>
        </Specimen>
        <Specimen id="card-button" state="onActivate: whole card is one button">
          <div class={styles.stretch}>
            <Card title={t('gallery.card.linkTitle')} headingLevel={3} onActivate={noop}>
              <p class={styles.intro}>{t('gallery.card.linkBody')}</p>
            </Card>
          </div>
        </Specimen>
      </GallerySection>

      <GallerySection id="list-row" title={t('gallery.section.listRow')}>
        <Specimen id="list-rows" state="href, secondary, status, last">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <List label={t('gallery.row.listLabel')}>
              <ListRow href="#/dev/gallery" primary={t('gallery.row.shop')} />
              <ListRow
                href="#/dev/gallery"
                primary={t('gallery.row.shop')}
                secondary={t('gallery.row.meta')}
              />
              <ListRow
                href="#/dev/gallery"
                primary={t('gallery.row.shop')}
                secondary={t('gallery.row.meta')}
                status={{ status: 'needs_action', label: t('gallery.chip.needsAction') }}
                last
              />
            </List>
          </div>
        </Specimen>
        <Specimen id="list-row-selected" state="onActivate + selected (multi-select)">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <List>
              <ListRow
                onActivate={noop}
                primary={t('gallery.row.shop')}
                secondary={t('gallery.row.meta')}
                selected
              />
              <ListRow
                onActivate={noop}
                primary={t('gallery.row.traveler')}
                secondary={t('gallery.row.meta')}
                selected={false}
                last
              />
            </List>
          </div>
        </Specimen>
        <Specimen id="list-row-long" state="longest-string fixture (TC-I18N-009, TC-I18N-010)">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <List>
              <ListRow
                href="#/dev/gallery"
                primary={t('gallery.row.shopLong')}
                secondary={t('gallery.row.meta')}
                status={{ status: 'customs_confirmed', label: t('gallery.chip.customsConfirmed') }}
                last
              />
            </List>
          </div>
        </Specimen>
      </GallerySection>

      <GallerySection id="status-chip" title={t('gallery.section.statusChip')}>
        {chips.map(([status, label]) => (
          <Specimen key={status} id={`status-chip-${status}`} state={`status: "${status}"`}>
            <StatusChip status={status} label={label} />
          </Specimen>
        ))}
      </GallerySection>

      <GallerySection id="empty-state" title={t('gallery.section.emptyState')}>
        <Specimen id="empty-state-receipts" state="mark + action + secondary">
          <div class={styles.stretch}>
            <EmptyState
              mark={FrogMarkIcon}
              headline={t('gallery.empty.headline')}
              body={t('gallery.empty.body')}
              action={{ label: t('gallery.empty.action'), onActivate: noop }}
              secondary={{ label: t('gallery.empty.secondary'), href: '#/dev/gallery' }}
            />
          </div>
        </Specimen>
      </GallerySection>
    </>
  );
}
