import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import type { Flashcard } from '@/lib/flashcards';
import { StudyIcon } from './StudyIcon';

function ModalShell({
  children,
  onClose,
  titleId,
}: {
  children: ReactNode;
  onClose: () => void;
  titleId: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm'>
      <div
        aria-labelledby={titleId}
        aria-modal='true'
        className='max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-outline-variant/25 bg-surface-container p-6 shadow-2xl outline-none sm:p-7'
        ref={dialogRef}
        role='dialog'
        tabIndex={-1}
      >
        <div className='flex justify-end'>
          <button
            aria-label='Close dialog'
            className='cursor-pointer rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface'
            onClick={onClose}
            type='button'
          >
            <StudyIcon className='h-5 w-5' name='x' />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ManualImportModal({
  error,
  manualText,
  onClose,
  onSubmit,
  onTextChange,
}: {
  error: string;
  manualText: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTextChange: (text: string) => void;
}) {
  return (
    <ModalShell onClose={onClose} titleId='manual-import-title'>
      <form onSubmit={onSubmit}>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>Manual import</p>
        <h2 className='mt-2 font-display text-3xl font-bold tracking-normal' id='manual-import-title'>
          Paste a simple card list.
        </h2>
        <p className='mt-3 text-sm leading-6 text-on-surface-variant'>
          Use blank lines between cards. Each card can use Q:/A: lines or a question::answer pair.
        </p>
        <label className='block'>
          <span className='sr-only'>Flashcard list</span>
          <textarea
            className='mt-5 min-h-56 w-full rounded-lg border border-outline-variant/25 bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface placeholder:text-on-surface-variant/60'
            onChange={(event) => onTextChange(event.target.value)}
            placeholder={'Q: What is placement?\nA: Introducing funds into the financial system.\n\nWhat is layering?::Moving funds through transactions.'}
            value={manualText}
          />
        </label>
        {error && (
          <p className='mt-3 text-xs font-semibold text-error' role='alert'>
            {error}
          </p>
        )}
        <button className='mt-4 w-full cursor-pointer rounded-lg bg-primary px-5 py-3 text-sm font-bold text-surface transition hover:bg-primary/90' type='submit'>
          Build local deck
        </button>
      </form>
    </ModalShell>
  );
}

export function EditCardModal({
  card,
  onCancel,
  onChange,
  onSubmit,
}: {
  card: Flashcard;
  onCancel: () => void;
  onChange: (card: Flashcard) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <ModalShell onClose={onCancel} titleId='edit-card-title'>
      <form onSubmit={onSubmit}>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>Edit {card.sourceId}</p>
        <h2 className='mt-2 font-display text-3xl font-bold tracking-normal' id='edit-card-title'>
          Clean up this card.
        </h2>
        <label className='mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant'>
          Question
          <textarea
            className='mt-2 min-h-28 w-full rounded-lg border border-outline-variant/25 bg-surface-container-lowest p-4 text-sm normal-case leading-6 tracking-normal text-on-surface'
            onChange={(event) => onChange({ ...card, question: event.target.value })}
            value={card.question}
          />
        </label>
        <label className='mt-4 block text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant'>
          Answer
          <textarea
            className='mt-2 min-h-32 w-full rounded-lg border border-outline-variant/25 bg-surface-container-lowest p-4 text-sm normal-case leading-6 tracking-normal text-on-surface'
            onChange={(event) => onChange({ ...card, answer: event.target.value })}
            value={card.answer}
          />
        </label>
        <button className='mt-4 w-full cursor-pointer rounded-lg bg-primary px-5 py-3 text-sm font-bold text-surface transition hover:bg-primary/90' type='submit'>
          Save card
        </button>
      </form>
    </ModalShell>
  );
}
