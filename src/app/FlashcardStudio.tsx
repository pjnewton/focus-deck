'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { createDeck, updateDeckCard } from '@/lib/deck';
import {
  parsePrintableFlashcardPage,
  type Flashcard,
  type FlashcardDraft,
  type FlashcardRating,
  type PdfTextItemLike,
} from '@/lib/flashcards';
import {
  createSprintSession,
  getStudyShortcut,
  moveToNextQueuedCard,
  moveToPreviousQueuedCard,
  rateCurrentCard,
} from '@/lib/studySessions';
import { INITIAL_STUDIO_FLOW, studioFlowReducer } from '@/lib/studioFlow';
import { BrowseView, Dashboard, ImportPanel } from './components/DeckViews';
import { EditCardModal } from './components/DeckModals';
import { CompleteView, StudyView } from './components/SessionViews';
import { StudyIcon } from './components/StudyIcon';
import styles from './study.module.css';
import { useStoredDeck } from './useStoredDeck';

const BUNDLED_PDF_PATH = '/acams-flashcards.pdf';
const BUNDLED_DECK_NAME = 'ACAMS flashcards';
const ALL_UNITS = 'all';

export default function FlashcardStudio() {
  const { deck, hasHydrated, persistenceError, setDeck } = useStoredDeck();
  const [flow, dispatch] = useReducer(studioFlowReducer, INITIAL_STUDIO_FLOW);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [error, setError] = useState('');
  const [sprintSize, setSprintSize] = useState<number>(40);
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>(ALL_UNITS);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const { isFlipped, session, view } = flow;
  const visibleError = error || persistenceError;

  const currentCard = useMemo(() => {
    if (!deck || !session?.queue[0]) return null;
    return deck.cards.find((card) => card.id === session.queue[0]) ?? null;
  }, [deck, session]);

  const filteredCards = useMemo(() => {
    if (!deck) return [];
    const term = search.trim().toLowerCase();
    if (!term) return deck.cards;
    return deck.cards.filter((card) =>
      [card.question, card.answer, card.sourceId, card.unit]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [deck, search]);

  const availableUnits = useMemo(() => {
    if (!deck) return [];
    return Array.from(new Set(deck.cards.map((card) => card.unit))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
    );
  }, [deck]);

  const selectedStudyCards = useMemo(() => {
    if (!deck) return [];
    if (selectedUnit === ALL_UNITS) return deck.cards;
    return deck.cards.filter((card) => card.unit === selectedUnit);
  }, [deck, selectedUnit]);

  const loadBundledDeck = useCallback(
    async ({ confirmReplace = false }: { confirmReplace?: boolean } = {}) => {
      if (confirmReplace && deck && !window.confirm('Replace your current local deck and its saved progress?')) {
        return;
      }

      setError('');
      setIsImporting(true);
      setImportProgress('Opening bundled ACAMS PDF...');

      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const response = await fetch(BUNDLED_PDF_PATH, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Bundled PDF unavailable: ${response.status}`);
        }

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(await response.arrayBuffer()),
        });
        const pdf = await loadingTask.promise;
        const drafts: FlashcardDraft[] = [];

        try {
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            setImportProgress(`Reading page ${pageNumber} of ${pdf.numPages}...`);
            const page = await pdf.getPage(pageNumber);
            const text = await page.getTextContent();
            drafts.push(
              ...parsePrintableFlashcardPage(
                text.items.flatMap((item): PdfTextItemLike[] =>
                  'str' in item ? [{ str: item.str, transform: item.transform }] : [],
                ),
                pageNumber,
              ),
            );
          }
        } finally {
          await pdf.destroy();
        }

        if (drafts.length === 0) {
          throw new Error('No supported three-row printable front/back cards were found.');
        }

        setDeck(createDeck(BUNDLED_DECK_NAME, drafts));
        setSelectedUnit(ALL_UNITS);
        dispatch({ type: 'replace-deck' });
        setImportProgress(`Ready: ${drafts.length} ACAMS cards extracted locally.`);
      } catch (cause) {
        console.error('[focus-deck:bundled-pdf-import]', cause);
        setError(
          'The ACAMS deck is temporarily unavailable. Please refresh and try again in a moment.',
        );
        setImportProgress('');
      } finally {
        setIsImporting(false);
      }
    },
    [deck, setDeck],
  );

  const startSprint = useCallback(
    (requestedSize = sprintSize) => {
      if (!deck || selectedStudyCards.length === 0) return;
      dispatch({
        type: 'start-sprint',
        session: createSprintSession(selectedStudyCards, requestedSize),
      });
    },
    [deck, selectedStudyCards, sprintSize],
  );

  const rateCard = useCallback(
    (rating: FlashcardRating) => {
      if (!deck || !session || !currentCard || !isFlipped) return;
      const result = rateCurrentCard(deck, session, currentCard.id, rating);
      if (!result) return;
      setDeck(result.deck);
      dispatch({ type: 'rate-card', session: result.session });
    },
    [currentCard, deck, isFlipped, session, setDeck],
  );

  const showAdjacentStudyCard = useCallback(
    (direction: 'next' | 'previous') => {
      if (!session) return;
      const nextSession =
        direction === 'next' ? moveToNextQueuedCard(session) : moveToPreviousQueuedCard(session);
      dispatch({ type: 'navigate-card', session: nextSession });
    },
    [session],
  );

  useEffect(() => {
    if (view !== 'study') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      const shortcut = getStudyShortcut(event);
      if (shortcut === 'flip') {
        event.preventDefault();
        dispatch({ type: 'flip-card' });
        return;
      }
      if (shortcut === 'next' || shortcut === 'previous') {
        event.preventDefault();
        showAdjacentStudyCard(shortcut);
        return;
      }
      if (shortcut) rateCard(shortcut);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rateCard, showAdjacentStudyCard, view]);

  function saveEditedCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deck || !editingCard) return;
    setDeck(updateDeckCard(deck, editingCard));
    setEditingCard(null);
  }

  if (!hasHydrated) {
    return (
      <main className={`${styles.studio} flex min-h-screen items-center justify-center`}>
        <div aria-live='polite' className='flex flex-col items-center gap-3' role='status'>
          <div className={`${styles.pulse} h-10 w-10 rounded-full bg-primary/70`} />
          <span className='sr-only'>Loading your saved local deck.</span>
        </div>
      </main>
    );
  }

  return (
    <div className={`${styles.studio} relative min-h-screen overflow-hidden text-on-surface`}>
      <div className={`${styles.grid} pointer-events-none absolute inset-0`} />
      <header className='relative z-20 border-b border-outline-variant/15 bg-surface/75 px-5 py-4 backdrop-blur-xl sm:px-8'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4'>
          <button
            className='cursor-pointer text-left'
            onClick={() => dispatch({ type: 'open-dashboard' })}
            type='button'
          >
            <span className='flex items-center gap-2 font-display text-lg font-bold tracking-normal text-on-surface'>
              <span className='flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary'>
                <StudyIcon className='h-4 w-4' name='bolt' />
              </span>
              Focus Deck
            </span>
          </button>
          <div className='flex items-center gap-2'>
            {deck && view !== 'study' && (
              <button
                className='hidden cursor-pointer rounded-lg border border-outline-variant/25 px-3 py-2 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface sm:inline-flex'
                onClick={() =>
                  dispatch({ type: view === 'browse' ? 'open-dashboard' : 'open-browse' })
                }
                type='button'
              >
                {view === 'browse' ? 'Dashboard' : 'Browse cards'}
              </button>
            )}
            {view === 'study' && (
              <button
                className='cursor-pointer rounded-lg border border-outline-variant/25 px-3 py-2 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface'
                onClick={() => dispatch({ type: 'open-dashboard' })}
                type='button'
              >
                End sprint
              </button>
            )}
          </div>
        </div>
      </header>

      <main className='relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14'>
        {deck && visibleError && (
          <p
            className='mb-7 rounded-lg border border-error/25 bg-error/10 px-4 py-3 text-sm font-semibold text-error'
            role='alert'
          >
            {visibleError}
          </p>
        )}
        {!deck && (
          <section className='grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16'>
            <div>
              <p className='mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary'>
                <StudyIcon className='h-4 w-4' name='lock' />
                Focused ACAMS review
              </p>
              <h1 className='max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-normal text-on-surface sm:text-7xl'>
                Study the cards.
                <span className='block text-primary'>Keep the momentum.</span>
              </h1>
              <p className='mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant'>
                Load the bundled ACAMS flashcard PDF, launch a focused sprint, and let
                the cards you miss cycle back while the answer is still fresh.
              </p>
              <div className='mt-8 flex flex-wrap gap-3 text-sm text-on-surface-variant'>
                {['ACAMS flashcards', 'Sprint study', 'Progress saved'].map(
                  (item) => (
                    <span
                      className='rounded-full border border-outline-variant/20 bg-surface-container-low/70 px-4 py-2'
                      key={item}
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <ImportPanel
              error={visibleError}
              importProgress={importProgress}
              isImporting={isImporting}
              onLoadBundledDeck={() => void loadBundledDeck()}
            />
          </section>
        )}

        {deck && view === 'dashboard' && (
          <Dashboard
            deck={deck}
            importProgress={importProgress}
            onBrowse={() => dispatch({ type: 'open-browse' })}
            onStart={() => startSprint()}
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            setSprintSize={setSprintSize}
            sprintSize={Math.min(sprintSize, selectedStudyCards.length)}
            studyCardCount={selectedStudyCards.length}
            units={availableUnits}
          />
        )}

        {deck && view === 'study' && currentCard && session && (
          <StudyView
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => dispatch({ type: 'flip-card' })}
            onRate={rateCard}
            session={session}
          />
        )}

        {deck && view === 'complete' && session && (
          <CompleteView
            onDashboard={() => dispatch({ type: 'open-dashboard' })}
            onStartAgain={() => startSprint()}
          />
        )}

        {deck && view === 'browse' && (
          <BrowseView
            cards={filteredCards}
            onEdit={setEditingCard}
            onSearch={setSearch}
            search={search}
          />
        )}
      </main>
      <footer className='relative z-10 mx-auto max-w-6xl px-5 pb-8 text-xs font-semibold text-on-surface-variant/70 sm:px-8'>
        &copy; {new Date().getFullYear()} zerosix industries
      </footer>
      {editingCard && (
        <EditCardModal
          card={editingCard}
          onCancel={() => setEditingCard(null)}
          onChange={setEditingCard}
          onSubmit={saveEditedCard}
        />
      )}
    </div>
  );
}
