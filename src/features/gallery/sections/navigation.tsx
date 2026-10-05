import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { useMessages } from '../../../i18n/index.ts';
import {
  Banner,
  BottomNav,
  Button,
  ClockIcon,
  GuideIcon,
  HomeIcon,
  ProgressBar,
  ReceiptIcon,
  StepIndicator,
  Toast,
} from '../../../ui/index.ts';
import { galleryCopy } from '../copy.ts';
import styles from '../Gallery.module.css';
import { GallerySection, Specimen } from '../Specimen.tsx';

const noop = () => {};

/** `components.md` sections 2, 8, 13 — navigation, progress and messaging (M1-3b, #24). */
export function NavigationSection(): JSX.Element {
  const t = useMessages(galleryCopy);
  const [toastOpen, setToastOpen] = useState(true);
  const [undoToastOpen, setUndoToastOpen] = useState(true);

  return (
    <>
      <GallerySection id="bottom-nav" title={t('gallery.section.bottomNav')}>
        <Specimen id="bottom-nav-default" state="4 items, one active, one with a count badge">
          <div class={`${styles.stretch} ${styles.surface}`}>
            <BottomNav
              label={t('gallery.nav.main')}
              items={[
                {
                  id: 'home',
                  href: '#/',
                  label: t('gallery.nav.home'),
                  icon: HomeIcon,
                  active: true,
                },
                {
                  id: 'receipts',
                  href: '#/receipts',
                  label: t('gallery.nav.receipts'),
                  icon: ReceiptIcon,
                  active: false,
                  badge: {
                    kind: 'count',
                    value: 3,
                    accessibleName: t('gallery.nav.receiptsBadge'),
                  },
                },
                {
                  id: 'airport',
                  href: '#/airport',
                  label: t('gallery.nav.airport'),
                  icon: ClockIcon,
                  active: false,
                  badge: { kind: 'dot' },
                },
                {
                  id: 'guide',
                  href: '#/guide',
                  label: t('gallery.nav.guide'),
                  icon: GuideIcon,
                  active: false,
                },
              ]}
            />
          </div>
        </Specimen>
      </GallerySection>

      <GallerySection id="progress" title={t('gallery.section.progress')}>
        <Specimen id="progress-bar" state="value: 3, max: 5, complete: false">
          <div class={styles.stretch}>
            <ProgressBar
              value={3}
              max={5}
              label={t('gallery.progress.label')}
              valueText={t('gallery.progress.value')}
            />
          </div>
        </Specimen>
        <Specimen id="progress-bar-complete" state="value: 5, max: 5, complete: true">
          <div class={styles.stretch}>
            <ProgressBar
              value={5}
              max={5}
              label={t('gallery.progress.label')}
              valueText="5/5"
              complete
            />
          </div>
        </Specimen>
        <Specimen id="step-indicator" state="current: 2, total: 5">
          <StepIndicator current={2} total={5} text={t('gallery.progress.step')} />
        </Specimen>
      </GallerySection>

      <GallerySection id="banner" title={t('gallery.section.banner')}>
        <Specimen
          id="banner-attention"
          state='tone: "attention", live: "none" (persistent shell banner)'
        >
          <div class={styles.stretch}>
            <Banner
              tone="attention"
              heading={t('gallery.banner.attentionHeading')}
              body={t('gallery.banner.attentionBody')}
              action={{ label: t('gallery.banner.attentionAction'), onActivate: noop }}
            />
          </div>
        </Specimen>
        <Specimen id="banner-info" state='tone: "info"'>
          <div class={styles.stretch}>
            <Banner tone="info" body={t('gallery.banner.infoBody')} />
          </div>
        </Specimen>
        <Specimen id="banner-success" state='tone: "success", live: "status"'>
          <div class={styles.stretch}>
            <Banner tone="success" body={t('gallery.banner.successBody')} live="status" />
          </div>
        </Specimen>
      </GallerySection>

      <GallerySection id="toast" title={t('gallery.section.toast')}>
        <Specimen id="toast-plain" state="no action, 5 s">
          <div class={styles.stretch}>
            {toastOpen ? (
              <Toast message={t('gallery.toast.saved')} onDismiss={() => setToastOpen(false)} />
            ) : (
              <Button variant="quiet" size="inline" onClick={() => setToastOpen(true)}>
                {t('gallery.toast.saved')}
              </Button>
            )}
          </div>
        </Specimen>
        <Specimen id="toast-with-action" state="action: Undo, 10 s">
          <div class={styles.stretch}>
            {undoToastOpen ? (
              <Toast
                message={t('gallery.toast.deleted')}
                action={{ label: t('gallery.toast.undo'), onActivate: noop }}
                onDismiss={() => setUndoToastOpen(false)}
              />
            ) : (
              <Button variant="quiet" size="inline" onClick={() => setUndoToastOpen(true)}>
                {t('gallery.toast.deleted')}
              </Button>
            )}
          </div>
        </Specimen>
      </GallerySection>
    </>
  );
}
