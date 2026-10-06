import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { useMessages } from '../../../i18n/index.ts';
import {
  BottomSheet,
  Button,
  ChecklistGroup,
  ChecklistRow,
  SelectSheet,
  Stepper,
} from '../../../ui/index.ts';
import { galleryCopy } from '../copy.ts';
import { GallerySection, Specimen } from '../Specimen.tsx';

const noop = () => {};

/**
 * `components.md` sections 9, 10, 11 (select sheet) and 12 — the Airport Mode components
 * (M1-3d, #26).
 *
 * The sheets and the stepper take the whole viewport, so their specimens open on demand
 * rather than rendering inline: a gallery with three fixed overlays stacked on it shows
 * nothing about any of them.
 */
export function AirportSection(): JSX.Element {
  const t = useMessages(galleryCopy);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [operator, setOperator] = useState<string | null>(null);
  const [ticked, setTicked] = useState<readonly string[]>(['g1']);

  const toggle = (id: string) => (checked: boolean) =>
    setTicked((current) => (checked ? [...current, id] : current.filter((value) => value !== id)));

  return (
    <>
      <GallerySection id="checklist" title={t('gallery.section.checklist')}>
        <Specimen
          id="checklist-group"
          state="legend: traveler, progress 2/4, one row warned, one routed to the counter"
        >
          <ChecklistGroup
            legend={t('gallery.checklist.traveler')}
            progress={{
              value: ticked.length,
              max: 4,
              label: t('gallery.checklist.progressLabel'),
              valueText: `${ticked.length}/4`,
            }}
          >
            <ChecklistRow
              id="g1"
              checked={ticked.includes('g1')}
              onChange={toggle('g1')}
              primary={t('gallery.checklist.shopA')}
              secondary={t('gallery.checklist.metaA')}
            />
            <ChecklistRow
              id="g2"
              checked={ticked.includes('g2')}
              onChange={toggle('g2')}
              primary={t('gallery.checklist.shopB')}
              secondary={t('gallery.checklist.metaB')}
              warning={{ tone: 'attention', text: t('gallery.checklist.warnChecked') }}
            />
            <ChecklistRow
              id="g3"
              checked={ticked.includes('g3')}
              onChange={toggle('g3')}
              primary={t('gallery.checklist.shopC')}
              secondary={t('gallery.checklist.metaC')}
              warning={{ tone: 'attention', text: t('gallery.checklist.warnDocuments') }}
            />
            <ChecklistRow
              id="g4"
              checked={false}
              onChange={noop}
              primary={t('gallery.checklist.shopD')}
              secondary={t('gallery.checklist.metaD')}
              excluded={{
                reason: t('gallery.checklist.excludedReason'),
                href: '#/airport/used-goods',
              }}
            />
          </ChecklistGroup>
        </Specimen>
      </GallerySection>

      <GallerySection id="bottom-sheet" title={t('gallery.section.bottomSheet')}>
        <Specimen
          id="bottom-sheet-open"
          state="open: true — Escape, scrim, swipe and back all close"
        >
          <Button onClick={() => setSheetOpen(true)}>{t('gallery.sheet.open')}</Button>
          <BottomSheet
            title={t('gallery.sheet.title')}
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
          >
            <p>{t('gallery.sheet.body')}</p>
            <Button onClick={() => setSheetOpen(false)}>{t('gallery.sheet.done')}</Button>
          </BottomSheet>
        </Specimen>

        <Specimen
          id="select-sheet"
          state="8 options, 2 groups, search shown above six, sentinel pinned, commits on Done"
        >
          <Button onClick={() => setSelectOpen(true)}>
            {operator ?? t('gallery.select.open')}
          </Button>
          {selectOpen ? (
            <SelectSheet
              title={t('gallery.select.title')}
              options={[
                { value: 'jj-taxfree', label: 'J&J Tax Free', group: t('gallery.select.common') },
                { value: 'pie-vat', label: 'PIE VAT', group: t('gallery.select.common') },
                { value: 'smart-detax', label: 'Smart Detax', group: t('gallery.select.common') },
                { value: 'global-blue', label: 'Global Blue', group: t('gallery.select.common') },
                { value: 'tourego', label: 'Tourego', group: t('gallery.select.others') },
                { value: 'ocean', label: 'Ocean', group: t('gallery.select.others') },
                { value: 'wamazing', label: 'WAmazing', group: t('gallery.select.others') },
                {
                  value: 'unknown',
                  label: t('gallery.select.unsure'),
                  secondary: t('gallery.select.unsureHelp'),
                  sentinel: true,
                },
              ]}
              value={operator}
              onChange={setOperator}
              searchLabel={t('gallery.select.search')}
              doneLabel={t('gallery.select.done')}
              onClose={() => setSelectOpen(false)}
            />
          ) : null}
        </Specimen>
      </GallerySection>

      <GallerySection id="stepper" title={t('gallery.section.stepper')}>
        <Specimen
          id="stepper-blocked"
          state="step 1/5, countdown, persistent banner, gate blocks and explains"
          note="Press the primary button: it stays enabled, scrolls to the unresolved row and announces the count"
        >
          <Button onClick={() => setStepperOpen(true)}>{t('gallery.stepper.open')}</Button>
          {stepperOpen ? (
            <Stepper
              step={{ current: 1, total: 5, text: t('gallery.stepper.step') }}
              title={t('gallery.stepper.title')}
              closeLabel={t('gallery.stepper.close')}
              onClose={() => setStepperOpen(false)}
              countdown={{
                text: t('gallery.stepper.countdown'),
                accessibleName: t('gallery.stepper.countdownName'),
              }}
              banner={{ tone: 'attention', body: t('gallery.stepper.banner') }}
              primary={{
                label: t('gallery.stepper.next'),
                onAdvance: () => ({ blockedBy: 's2', count: 2 }),
                blockedAnnouncement: (count) =>
                  t('gallery.stepper.blocked', { count: String(count) }),
              }}
              secondary={{
                label: t('gallery.stepper.wrong'),
                onActivate: noop,
              }}
            >
              <ChecklistRow
                id="s1"
                checked
                onChange={noop}
                primary={t('gallery.checklist.shopA')}
                secondary={t('gallery.checklist.metaA')}
              />
              <ChecklistRow
                id="s2"
                checked={false}
                onChange={noop}
                primary={t('gallery.checklist.shopB')}
                secondary={t('gallery.checklist.metaB')}
                warning={{ tone: 'attention', text: t('gallery.checklist.warnChecked') }}
              />
            </Stepper>
          ) : null}
        </Specimen>
      </GallerySection>
    </>
  );
}
