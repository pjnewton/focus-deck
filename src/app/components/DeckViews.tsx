import type { Deck } from '@/lib/deck';
import type { Flashcard } from '@/lib/flashcards';
import styles from '../study.module.css';
import { StudyIcon } from './StudyIcon';

const SPRINT_SIZES = [20, 40, 80] as const;

export function ImportPanel({
  error,
  importProgress,
  isImporting,
  onLoadBundledDeck,
  onTryDemo,
}: {
  error: string;
  importProgress: string;
  isImporting: boolean;
  onLoadBundledDeck: () => void;
  onTryDemo: () => void;
}) {
  return (
    <div
      className={`${styles.dropZone} rounded-lg border border-outline-variant/25 p-5 transition sm:p-7`}
    >
      <div className='rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-7 text-center sm:p-10'>
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary'>
          <StudyIcon className='h-7 w-7' name='deck' />
        </span>
        <h2 className='mt-6 font-display text-2xl font-bold tracking-normal'>
          {isImporting ? 'Building your deck' : 'Load the ACAMS deck'}
        </h2>
        <p className='mt-2 text-sm leading-6 text-on-surface-variant'>
          Focus Deck reads the bundled three-row foldable printable PDF in your browser and saves
          study progress locally.
        </p>
        <button
          className='mt-6 cursor-pointer rounded-lg bg-primary px-5 py-3 text-sm font-bold text-surface transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60'
          disabled={isImporting}
          onClick={onLoadBundledDeck}
          type='button'
        >
          {isImporting ? 'Reading PDF...' : 'Load ACAMS deck'}
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
      </div>
    </div>
  );
}

export function Dashboard({
  deck,
  importProgress,
  onBrowse,
  onClear,
  onLoadBundledDeck,
  onResetProgress,
  onStart,
  setSprintSize,
  sprintSize,
}: {
  deck: Deck;
  importProgress: string;
  onBrowse: () => void;
  onClear: () => void;
  onLoadBundledDeck: () => void;
  onResetProgress: () => void;
  onStart: () => void;
  setSprintSize: (size: number) => void;
  sprintSize: number;
}) {
  const sprintSizes = SPRINT_SIZES.filter((size) => size < deck.cards.length);

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
            Focus Deck gives you a short queue of flashcards and loops the difficult ones back while
            the idea is still fresh.
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

      <div className='mt-9 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]'>
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
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <StudyIcon name='deck' />
            </span>
            <div>
              <h2 className='font-display text-xl font-bold tracking-normal'>Card library</h2>
              <p className='text-sm text-on-surface-variant'>{deck.cards.length} flashcards</p>
            </div>
          </div>
          <p className='mt-5 text-sm leading-6 text-on-surface-variant'>
            Browse the imported cards when you want to search, fix wording, or review what is in the
            deck before starting a sprint.
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

      <div className='mt-7 flex flex-wrap gap-4 text-xs font-semibold text-on-surface-variant'>
        <button className='cursor-pointer transition hover:text-on-surface' onClick={onLoadBundledDeck} type='button'>
          Reload ACAMS deck
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

export function BrowseView({
  cards,
  onEdit,
  onSearch,
  search,
}: {
  cards: Flashcard[];
  onEdit: (card: Flashcard) => void;
  onSearch: (search: string) => void;
  search: string;
}) {
  return (
    <section>
      <div className='flex flex-col justify-between gap-5 md:flex-row md:items-end'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.22em] text-primary'>Deck library</p>
          <h1 className='mt-3 font-display text-4xl font-bold tracking-normal sm:text-5xl'>Browse your cards.</h1>
          <p className='mt-3 text-sm text-on-surface-variant'>{cards.length} flashcards</p>
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
