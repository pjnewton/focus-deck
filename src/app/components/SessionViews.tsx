import type { Flashcard, FlashcardRating } from '@/lib/flashcards';
import type { Session } from '@/lib/studySessions';
import styles from '../study.module.css';
import { StudyIcon } from './StudyIcon';

export function StudyView({
  card,
  isFlipped,
  onFlip,
  onRate,
  session,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: FlashcardRating) => void;
  session: Session;
}) {
  const completed = Math.max(0, session.startingCount - session.queue.length);
  const percent =
    session.startingCount > 0 ? Math.round((completed / session.startingCount) * 100) : 0;

  return (
    <section className='mx-auto max-w-4xl'>
      <div className='flex items-end justify-between gap-5'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>Focus sprint</p>
          <h1 className='mt-2 font-display text-3xl font-bold tracking-normal sm:text-4xl'>Stay in the rhythm.</h1>
        </div>
        <div className='text-right'>
          <p className='font-display text-2xl font-bold text-primary'>{percent}%</p>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant'>complete</p>
        </div>
      </div>

      <div className='mt-5 rounded-lg border border-outline-variant/20 bg-surface-container-low/80 p-4'>
        <div
          aria-label='Sprint progress'
          aria-valuemax={session.startingCount}
          aria-valuemin={0}
          aria-valuenow={completed}
          className='h-2 overflow-hidden rounded-full bg-surface-container-high'
          role='progressbar'
        >
          <div className={`${styles.meterFill} h-full rounded-full bg-primary`} style={{ width: `${percent}%` }} />
        </div>
        <div className='mt-4 grid grid-cols-3 gap-3 text-center'>
          <ProgressStat label='Done' value={completed} />
          <ProgressStat label='Left' value={session.queue.length} />
          <ProgressStat label='Reviews' value={session.reviews} />
        </div>
      </div>

      <button
        aria-label={isFlipped ? 'Show question' : 'Show answer'}
        className={`${styles.cardScene} mt-7 block w-full cursor-pointer text-left`}
        onClick={onFlip}
        type='button'
      >
        <span className={`${styles.cardInner} ${isFlipped ? styles.cardInnerFlipped : ''} block`}>
          <span aria-hidden={isFlipped} className={`${styles.cardFace} p-7 sm:p-10`}>
            <CardMeta card={card} side='Question' />
            <span className='flex flex-1 items-center'>
              <span className='max-w-3xl font-display text-3xl font-bold leading-[1.14] tracking-normal sm:text-5xl'>
                {card.question}
              </span>
            </span>
            <span className='flex items-center justify-between gap-4 text-xs font-semibold text-on-surface-variant'>
              <span>Think it through, then reveal.</span>
              <span className='flex items-center gap-1.5'>
                <span className='rounded-lg border border-outline-variant/25 px-2 py-1'>Space</span>
                <span className='rounded-lg border border-outline-variant/25 px-2 py-1'>&larr;</span>
                <span className='rounded-lg border border-outline-variant/25 px-2 py-1'>&rarr;</span>
              </span>
            </span>
          </span>
          <span aria-hidden={!isFlipped} className={`${styles.cardFace} ${styles.cardBack} p-7 sm:p-10`}>
            <CardMeta card={card} side='Answer' />
            <span className='flex flex-1 items-center'>
              <span className='max-w-3xl text-xl font-semibold leading-8 text-on-surface sm:text-3xl sm:leading-10'>
                {card.answer}
              </span>
            </span>
            <span className='text-xs font-semibold text-primary'>Rate your recall below.</span>
          </span>
        </span>
      </button>

      <div className='mt-5 grid gap-2 sm:grid-cols-3'>
        <RatingButton disabled={!isFlipped} hint='1' label='Again' onClick={() => onRate('again')} tone='red' />
        <RatingButton disabled={!isFlipped} hint='2' label='Hard' onClick={() => onRate('hard')} tone='amber' />
        <RatingButton disabled={!isFlipped} hint='3' label='Got it' onClick={() => onRate('got-it')} tone='green' />
      </div>

      <p className='mt-5 text-center text-xs font-semibold text-on-surface-variant'>
        Keep moving through the queue at your own pace.
      </p>
    </section>
  );
}

function ProgressStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className='font-display text-xl font-bold text-on-surface'>{value}</p>
      <p className='mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant'>
        {label}
      </p>
    </div>
  );
}

function CardMeta({ card, side }: { card: Flashcard; side: string }) {
  return (
    <span className='flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant'>
      <span>{side}</span>
      <span>
        {card.unit} | {card.sourceId}
      </span>
    </span>
  );
}

function RatingButton({
  disabled,
  hint,
  label,
  onClick,
  tone,
}: {
  disabled: boolean;
  hint: string;
  label: string;
  onClick: () => void;
  tone: 'amber' | 'green' | 'red';
}) {
  const tones = {
    amber: 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/15',
    green: 'border-primary/35 bg-primary/15 text-primary hover:bg-primary/20',
    red: 'border-error/30 bg-error/10 text-error hover:bg-error/20',
  };

  return (
    <button
      className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${tones[tone]}`}
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      {label}
      <span className='rounded-md border border-current/30 px-1.5 py-0.5 text-[0.65rem]'>{hint}</span>
    </button>
  );
}

export function CompleteView({
  onDashboard,
  onStartAgain,
}: {
  onDashboard: () => void;
  onStartAgain: () => void;
}) {
  return (
    <section className='mx-auto max-w-2xl rounded-lg border border-primary/25 bg-surface-container-low/90 p-7 text-center shadow-2xl sm:p-12'>
      <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary'>
        <StudyIcon className='h-8 w-8' name='spark' />
      </span>
      <p className='mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary'>Sprint complete</p>
      <h1 className='mt-3 font-display text-4xl font-bold tracking-normal sm:text-5xl'>Nice work. Take the win.</h1>
      <p className='mt-4 text-base leading-7 text-on-surface-variant'>
        You finished this sprint. Your deck is saved locally and ready whenever you want another pass.
      </p>
      <div className='mt-7 grid gap-3 sm:grid-cols-2'>
        <button
          className='cursor-pointer rounded-lg bg-primary px-5 py-4 text-sm font-bold text-surface transition hover:bg-primary/90'
          onClick={onStartAgain}
          type='button'
        >
          Start another sprint
        </button>
        <button
          className='cursor-pointer rounded-lg border border-outline-variant/25 px-5 py-4 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface'
          onClick={onDashboard}
          type='button'
        >
          Back to dashboard
        </button>
      </div>
    </section>
  );
}
