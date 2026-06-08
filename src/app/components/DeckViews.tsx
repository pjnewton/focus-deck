import type { DragEvent, RefObject } from 'react';
import { confidenceLabel, type Deck, type DeckStats } from '@/lib/deck';
import type { Flashcard } from '@/lib/flashcards';
import styles from '../study.module.css';
import { StudyIcon } from './StudyIcon';

const SPRINT_SIZES = [20, 40, 80] as const;
const TEST_SIZES = [10, 20, 40] as const;

export function ImportPanel({
  error,
  fileInputRef,
  importProgress,
  isDragging,
  isImporting,
  onDragLeave,
  onDragOver,
  onDrop,
  onOpenManual,
  onTryDemo,
}: {
  error: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  importProgress: string;
  isDragging: boolean;
  isImporting: boolean;
  onDragLeave: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onOpenManual: () => void;
  onTryDemo: () => void;
}) {
  return (
    <div
      className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''} rounded-lg border border-outline-variant/25 p-5 transition sm:p-7`}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className='rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-7 text-center sm:p-10'>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary'>
          <StudyIcon className='h-7 w-7' name='upload' />
        </span>
        <h2 className='mt-6 font-display text-2xl font-bold tracking-normal'>
          {isImporting ? 'Building your deck' : 'Drop in a supported flashcard PDF'}
        </h2>
        <p className='mt-2 text-sm leading-6 text-on-surface-variant'>
          Focus Deck reads the three-row foldable printable format locally and never sends your file
          to a server.
        </p>
        <button
          className='mt-6 cursor-pointer rounded-lg bg-primary px-5 py-3 text-sm font-bold text-surface transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60'
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
          type='button'
        >
          {isImporting ? 'Reading PDF...' : 'Choose PDF'}
        </button>
      </div>
      {importProgress && (
        <p aria-live='polite' className='mt-4 text-center text-xs font-semibold text-primary' role='status'>
          {importProgress}
        </p>
      )}
      {error && (
        <p className='mt-4 text-center text-xs font-semibold text-error' role='alert'>
          {error}
        </p>
      )}
      <div className='mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-on-surface-variant'>
        <button className='cursor-pointer transition hover:text-on-surface' onClick={onTryDemo} type='button'>
          Load demo deck
        </button>
        <button className='cursor-pointer transition hover:text-on-surface' onClick={onOpenManual} type='button'>
          Import pasted text
        </button>
      </div>
    </div>
  );
}

export function Dashboard({
  deck,
  importProgress,
  onBrowse,
  onChoosePdf,
  onClear,
  onResetProgress,
  onStart,
  onStartTest,
  setSprintSize,
  setTestSize,
  sprintSize,
  stats,
  testSize,
}: {
  deck: Deck;
  importProgress: string;
  onBrowse: () => void;
  onChoosePdf: () => void;
  onClear: () => void;
  onResetProgress: () => void;
  onStart: () => void;
  onStartTest: () => void;
  setSprintSize: (size: number) => void;
  setTestSize: (size: number) => void;
  sprintSize: number;
  stats: DeckStats;
  testSize: number;
}) {
  const masteryPercent = Math.round((stats.mastered / Math.max(deck.cards.length, 1)) * 100);
  const canStartTest = deck.cards.length >= 4;
  const sprintSizes = SPRINT_SIZES.filter((size) => size < deck.cards.length);
  const testSizes = TEST_SIZES.filter((size) => size < deck.cards.length);
  const effectiveTestSize = Math.min(testSize, deck.cards.length);

  return (
    <section>
      <div className='flex flex-col justify-between gap-7 lg:flex-row lg:items-end'>
        <div>
          <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary'>
            <StudyIcon className='h-4 w-4' name='check' />
            Deck ready
          </p>
          <h1 className='mt-4 max-w-4xl font-display text-4xl font-bold tracking-normal sm:text-6xl'>
            Pick a sprint.
            <span className='block text-primary'>Build recall quickly.</span>
          </h1>
          <p className='mt-5 max-w-2xl text-base leading-7 text-on-surface-variant'>
            Focus Deck starts with your least-practiced cards and loops the difficult ones back into
            the queue.
          </p>
        </div>
        <div className='rounded-lg border border-outline-variant/20 bg-surface-container-low/75 px-5 py-4'>
          <p className='text-[0.66rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant'>Current deck</p>
          <p className='mt-1 max-w-xs truncate font-display text-lg font-bold'>{deck.name}</p>
          <p className='mt-1 text-xs text-on-surface-variant'>{deck.cards.length} local cards</p>
        </div>
      </div>

      {importProgress && (
        <p
          aria-live='polite'
          className='mt-7 rounded-lg border border-primary/20 bg-primary/[0.07] px-4 py-3 text-sm font-semibold text-primary'
          role='status'
        >
          {importProgress}
        </p>
      )}

      <div className='mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Stat label='Mastered' value={`${stats.mastered}`} detail={`${masteryPercent}% of deck`} color='text-primary' />
        <Stat label='Learning' value={`${stats.learning}`} detail='In active rotation' color='text-on-surface' />
        <Stat label='Fresh' value={`${stats.fresh}`} detail='Not seen yet' color='text-on-surface-variant' />
        <Stat label='Reviews' value={`${stats.reviews}`} detail='Local history' color='text-on-surface' />
      </div>

      <div className='mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-lg border border-outline-variant/20 bg-surface-container-low/85 p-6 sm:p-7'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <StudyIcon name='bolt' />
            </span>
            <div>
              <h2 className='font-display text-2xl font-bold tracking-normal'>Start a focus sprint</h2>
              <p className='text-sm text-on-surface-variant'>Choose a short set and get moving.</p>
            </div>
          </div>
          <div className='mt-6 flex flex-wrap gap-2'>
            {sprintSizes.map((size) => (
              <button
                className={`cursor-pointer rounded-lg border px-4 py-3 text-sm font-bold transition ${
                  sprintSize === size
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                key={size}
                onClick={() => setSprintSize(size)}
                type='button'
              >
                {size} cards
              </button>
            ))}
            <button
              className={`cursor-pointer rounded-lg border px-4 py-3 text-sm font-bold transition ${
                sprintSize === deck.cards.length
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
              onClick={() => setSprintSize(deck.cards.length)}
              type='button'
            >
              Full deck
            </button>
          </div>
          <button
            className='mt-6 flex w-full cursor-pointer items-center justify-between rounded-lg bg-primary px-5 py-4 text-sm font-bold text-surface transition hover:bg-primary/90'
            onClick={onStart}
            type='button'
          >
            Launch sprint
            <StudyIcon className='h-4 w-4' name='arrow' />
          </button>
        </div>

        <div className='rounded-lg border border-outline-variant/20 bg-surface-container-low/85 p-6 sm:p-7'>
          <div className='flex items-center justify-between'>
            <h2 className='font-display text-xl font-bold tracking-normal'>Mastery meter</h2>
            <span className='text-sm font-bold text-primary'>{masteryPercent}%</span>
          </div>
          <div className='mt-4 h-2 overflow-hidden rounded-full bg-surface-container-high'>
            <div
              className={`${styles.meterFill} h-full rounded-full bg-primary`}
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
          <p className='mt-5 text-sm leading-6 text-on-surface-variant'>
            Each confident answer raises a card&apos;s score. Missed cards move back into your sprint
            automatically.
          </p>
          <button
            className='mt-5 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary transition hover:text-on-surface'
            onClick={onBrowse}
            type='button'
          >
            <StudyIcon className='h-4 w-4' name='deck' />
            Browse and edit cards
          </button>
        </div>
      </div>

      <div className='mt-5 rounded-lg border border-outline-variant/20 bg-surface-container-low/85 p-6 sm:p-7'>
        <div className='flex flex-col justify-between gap-5 md:flex-row md:items-center'>
          <div>
            <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>Test mode</p>
            <h2 className='mt-2 font-display text-2xl font-bold tracking-normal'>Build a multiple-choice test</h2>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant'>
              Questions and correct answers come from your deck. Focus Deck generates believable
              wrong choices locally from similar cards, with no upload or external service.
            </p>
          </div>
          <div className='flex min-w-fit flex-wrap gap-2'>
            {testSizes.map((size) => (
              <button
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold transition ${
                  testSize === size
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
                key={size}
                onClick={() => setTestSize(size)}
                type='button'
              >
                {size}
              </button>
            ))}
            <button
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold transition ${
                testSize === deck.cards.length
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
              onClick={() => setTestSize(deck.cards.length)}
              type='button'
            >
              Full deck
            </button>
          </div>
        </div>
        <button
          className='mt-5 flex w-full cursor-pointer items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-5 py-4 text-sm font-bold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-45'
          disabled={!canStartTest}
          onClick={onStartTest}
          type='button'
        >
          {canStartTest ? `Start ${effectiveTestSize}-question test` : 'Add at least four cards to start a test'}
          <StudyIcon className='h-4 w-4' name='arrow' />
        </button>
      </div>

      <div className='mt-7 flex flex-wrap gap-4 text-xs font-semibold text-on-surface-variant'>
        <button className='cursor-pointer transition hover:text-on-surface' onClick={onChoosePdf} type='button'>
          Replace PDF
        </button>
        <button className='cursor-pointer transition hover:text-on-surface' onClick={onResetProgress} type='button'>
          Reset progress
        </button>
        <button className='cursor-pointer transition hover:text-error' onClick={onClear} type='button'>
          Remove local deck
        </button>
      </div>
    </section>
  );
}

function Stat({
  color,
  detail,
  label,
  value,
}: {
  color: string;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className='rounded-lg border border-outline-variant/20 bg-surface-container-low/75 px-5 py-4'>
      <p className='text-[0.66rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant'>{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold tracking-normal ${color}`}>{value}</p>
      <p className='mt-1 text-xs text-on-surface-variant'>{detail}</p>
    </div>
  );
}

export function BrowseView({
  cards,
  onEdit,
  onSearch,
  search,
  stats,
}: {
  cards: Flashcard[];
  onEdit: (card: Flashcard) => void;
  onSearch: (search: string) => void;
  search: string;
  stats: DeckStats;
}) {
  return (
    <section>
      <div className='flex flex-col justify-between gap-5 md:flex-row md:items-end'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.22em] text-primary'>Deck library</p>
          <h1 className='mt-3 font-display text-4xl font-bold tracking-normal sm:text-5xl'>Browse your cards.</h1>
          <p className='mt-3 text-sm text-on-surface-variant'>{stats.mastered} mastered | {stats.learning} learning | {stats.fresh} fresh</p>
        </div>
        <label className='flex min-w-64 items-center gap-2 rounded-lg border border-outline-variant/25 bg-surface-container-low px-3 py-2 text-on-surface-variant'>
          <StudyIcon className='h-4 w-4' name='search' />
          <span className='sr-only'>Search cards</span>
          <input
            className='w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70'
            onChange={(event) => onSearch(event.target.value)}
            placeholder='Search cards'
            value={search}
          />
        </label>
      </div>

      <div className='mt-7 grid gap-3'>
        {cards.map((card) => (
          <article className='rounded-lg border border-outline-variant/20 bg-surface-container-low/80 p-5' key={card.id}>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant'>
                <span>{card.unit}</span>
                <span>|</span>
                <span>{card.sourceId}</span>
                <span className='rounded-full border border-outline-variant/25 px-2 py-1 text-[0.6rem]'>{confidenceLabel(card)}</span>
              </div>
              <button
                className='inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-primary transition hover:text-on-surface'
                onClick={() => onEdit(card)}
                type='button'
              >
                <StudyIcon className='h-3.5 w-3.5' name='edit' />
                Edit
              </button>
            </div>
            <h2 className='mt-4 font-display text-lg font-bold tracking-normal'>{card.question}</h2>
            <p className='mt-2 text-sm leading-6 text-on-surface-variant'>{card.answer}</p>
          </article>
        ))}
      </div>
      {cards.length === 0 && <p className='mt-10 text-center text-sm text-on-surface-variant'>No cards match that search.</p>}
    </section>
  );
}
