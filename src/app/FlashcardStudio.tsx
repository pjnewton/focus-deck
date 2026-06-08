'use client';

import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createDeck, resetDeckProgress, updateDeckCard, type Deck } from '@/lib/deck';
import {
  parseDelimitedFlashcards,
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
import { EditCardModal, ManualImportModal } from './components/DeckModals';
import { CompleteView, StudyView } from './components/SessionViews';
import { StudyIcon } from './components/StudyIcon';
import styles from './study.module.css';
import { useStoredDeck } from './useStoredDeck';

const DEMO_CARDS: FlashcardDraft[] = [
  {
    sourceId: 'demo-1',
    unit: 'Demo',
    question: 'What is the goal of a focus sprint?',
    answer: 'Move quickly through a small set, then repeat the cards that need another pass.',
  },
  {
    sourceId: 'demo-2',
    unit: 'Demo',
    question: 'Which key flips the current card?',
    answer: 'Press Space to reveal the answer.',
  },
  {
    sourceId: 'demo-3',
    unit: 'Demo',
    question: 'What happens when you rate a card Again?',
    answer: 'The card returns near the front of your queue so you can retry it while the idea is fresh.',
  },
  {
    sourceId: 'demo-4',
    unit: 'Demo',
    question: 'Where does your imported deck live?',
    answer: 'Only in this browser using local storage. The PDF is never uploaded.',
  },
  {
    sourceId: 'demo-5',
    unit: 'Demo',
    question: 'What should you do when an answer feels familiar but uncertain?',
    answer: 'Choose Hard. Honest ratings make the next sprint more useful.',
  },
  {
    sourceId: 'demo-6',
    unit: 'Demo',
    question: 'How do you return to the dashboard during a sprint?',
    answer: 'Use the End sprint button in the top-right corner.',
  },
];

export default function FlashcardStudio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRunIdRef = useRef(0);
  const { deck, hasHydrated, persistenceError, setDeck } = useStoredDeck();
  const [flow, dispatch] = useReducer(studioFlowReducer, INITIAL_STUDIO_FLOW);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [error, setError] = useState('');
  const [sprintSize, setSprintSize] = useState<number>(40);
  const [search, setSearch] = useState('');
  const [manualText, setManualText] = useState('');
  const [showManualImport, setShowManualImport] = useState(false);
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

  const replaceDeck = useCallback(
    (nextDeck: Deck | null, progress = '') => {
      importRunIdRef.current += 1;
      setDeck(nextDeck);
      dispatch({ type: 'replace-deck' });
      setError('');
      setImportProgress(progress);
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [setDeck],
  );

  const importDeck = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Choose a PDF file to build your deck.');
        return;
      }
      if (deck && !window.confirm('Replace your current local deck and its saved progress?')) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const importRunId = importRunIdRef.current + 1;
      importRunIdRef.current = importRunId;
      const isCurrentImport = () => importRunIdRef.current === importRunId;

      setError('');
      setIsImporting(true);
      setImportProgress('Opening PDF locally...');

      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
        });
        const pdf = await loadingTask.promise;
        const drafts: FlashcardDraft[] = [];

        try {
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            if (!isCurrentImport()) return;
            setImportProgress(`Reading page ${pageNumber} of ${pdf.numPages}...`);
            const page = await pdf.getPage(pageNumber);
            const text = await page.getTextContent();
            if (!isCurrentImport()) return;
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

        if (!isCurrentImport()) return;
        setDeck(createDeck(file.name.replace(/\.pdf$/i, ''), drafts));
        dispatch({ type: 'replace-deck' });
        setImportProgress(`Ready: ${drafts.length} cards extracted locally.`);
      } catch (cause) {
        if (!isCurrentImport()) return;
        console.error('[focus-deck:pdf-import]', cause);
        setError(
          'I could not read supported three-row cards from that PDF. You can try the manual text importer instead.',
        );
        setImportProgress('');
      } finally {
        if (isCurrentImport()) {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    },
    [deck, setDeck],
  );

  const startSprint = useCallback(
    (requestedSize = sprintSize) => {
      if (!deck) return;
      dispatch({ type: 'start-sprint', session: createSprintSession(deck.cards, requestedSize) });
    },
    [deck, sprintSize],
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void importDeck(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void importDeck(file);
  }

  function importManualCards(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cards = parseDelimitedFlashcards(manualText);
    if (cards.length === 0) {
      setError('Use one Q:/A: block per card, or separate each question and answer with ::.');
      return;
    }
    replaceDeck(createDeck('Manual study deck', cards), `Ready: ${cards.length} manually entered cards.`);
    setError('');
    setManualText('');
    setShowManualImport(false);
  }

  function saveEditedCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deck || !editingCard) return;
    setDeck(updateDeckCard(deck, editingCard));
    setEditingCard(null);
  }

  function resetProgress() {
    if (!deck || !window.confirm('Reset saved study progress in this deck?')) return;
    setDeck(resetDeckProgress(deck));
  }

  function clearDeck() {
    if (!window.confirm('Remove the local deck from this browser?')) return;
    replaceDeck(null);
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
            <span className='ml-10 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-on-surface-variant'>
              Local study studio
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
            <span className='hidden rounded-lg border border-outline-variant/25 px-3 py-2 text-xs font-semibold text-on-surface-variant sm:inline-flex'>
              Local only
            </span>
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
                Private by design
              </p>
              <h1 className='max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-normal text-on-surface sm:text-7xl'>
                Study the cards.
                <span className='block text-primary'>Keep the momentum.</span>
              </h1>
              <p className='mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant'>
                Import a supported three-row foldable flashcard PDF, launch a focused sprint, and let
                the cards you miss cycle back while the answer is still fresh.
              </p>
              <div className='mt-8 flex flex-wrap gap-3 text-sm text-on-surface-variant'>
                {['PDF stays in your browser', 'Keyboard-friendly study', 'Progress saved locally'].map(
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
              fileInputRef={fileInputRef}
              importProgress={importProgress}
              isDragging={isDragging}
              isImporting={isImporting}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
              onOpenManual={() => setShowManualImport(true)}
              onTryDemo={() => {
                replaceDeck(createDeck('Focus Deck demo', DEMO_CARDS));
              }}
            />
          </section>
        )}

        {deck && view === 'dashboard' && (
          <Dashboard
            deck={deck}
            importProgress={importProgress}
            onBrowse={() => dispatch({ type: 'open-browse' })}
            onChoosePdf={() => fileInputRef.current?.click()}
            onClear={clearDeck}
            onResetProgress={resetProgress}
            onStart={() => startSprint()}
            setSprintSize={setSprintSize}
            sprintSize={Math.min(sprintSize, deck.cards.length)}
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

      <input
        accept='application/pdf,.pdf'
        className='hidden'
        onChange={handleFileChange}
        ref={fileInputRef}
        type='file'
      />

      {showManualImport && (
        <ManualImportModal
          error={visibleError}
          manualText={manualText}
          onClose={() => setShowManualImport(false)}
          onSubmit={importManualCards}
          onTextChange={setManualText}
        />
      )}
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
