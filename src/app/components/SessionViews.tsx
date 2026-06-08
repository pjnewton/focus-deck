import type { Flashcard, FlashcardRating, MultipleChoiceQuestion } from '@/lib/flashcards';
import type { Session, TestAnswer, TestSession } from '@/lib/studySessions';
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
  const percent = Math.round((completed / session.startingCount) * 100);

  return (
    <section className='mx-auto max-w-4xl'>
      <div className='flex items-end justify-between gap-5'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>Focus sprint</p>
          <h1 className='mt-2 font-display text-3xl font-bold tracking-normal sm:text-4xl'>Stay in the rhythm.</h1>
        </div>
        <div className='text-right'>
          <p className='font-display text-2xl font-bold text-primary'>{session.queue.length}</p>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant'>in queue</p>
        </div>
      </div>

      <div className='mt-5 h-1.5 overflow-hidden rounded-full bg-surface-container-high'>
        <div className={`${styles.meterFill} h-full rounded-full bg-primary`} style={{ width: `${percent}%` }} />
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

      <div className='mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-on-surface-variant'>
        <span>{session.reviews} reviews this sprint</span>
        <span>Current streak: {session.streak} | Best: {session.bestStreak}</span>
      </div>
    </section>
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
  session,
}: {
  onDashboard: () => void;
  onStartAgain: () => void;
  session: Session;
}) {
  return (
    <section className='mx-auto max-w-2xl rounded-lg border border-primary/25 bg-surface-container-low/90 p-7 text-center shadow-2xl sm:p-12'>
      <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary'>
        <StudyIcon className='h-8 w-8' name='spark' />
      </span>
      <p className='mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary'>Sprint complete</p>
      <h1 className='mt-3 font-display text-4xl font-bold tracking-normal sm:text-5xl'>Nice work. Take the win.</h1>
      <p className='mt-4 text-base leading-7 text-on-surface-variant'>
        You finished {session.reviews} reviews with a best streak of {session.bestStreak}. Your confidence scores are saved locally.
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

export function TestView({
  answer,
  onChoose,
  onNext,
  onSubmit,
  question,
  selectedOptionId,
  session,
}: {
  answer: TestAnswer | null;
  onChoose: (optionId: string) => void;
  onNext: () => void;
  onSubmit: () => void;
  question: MultipleChoiceQuestion;
  selectedOptionId: string;
  session: TestSession;
}) {
  const correctCount = session.answers.filter((item) => item.isCorrect).length;
  const questionNumber = session.currentIndex + 1;
  const percent = Math.round((questionNumber / session.questions.length) * 100);

  return (
    <section className='mx-auto max-w-4xl'>
      <div className='flex items-end justify-between gap-5'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>Multiple-choice test</p>
          <h1 className='mt-2 font-display text-3xl font-bold tracking-normal sm:text-4xl'>
            Choose the best answer.
          </h1>
        </div>
        <div className='text-right'>
          <p className='font-display text-2xl font-bold text-primary'>{correctCount}</p>
          <p className='text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant'>correct</p>
        </div>
      </div>

      <div className='mt-5 h-1.5 overflow-hidden rounded-full bg-surface-container-high'>
        <div className={`${styles.meterFill} h-full rounded-full bg-primary`} style={{ width: `${percent}%` }} />
      </div>

      <div className='mt-7 rounded-lg border border-outline-variant/20 bg-surface-container-low/90 p-6 shadow-2xl sm:p-8'>
        <div className='flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant'>
          <span>Question {questionNumber} of {session.questions.length}</span>
          <span>{question.unit} | {question.sourceId}</span>
        </div>
        <h2 className='mt-5 font-display text-2xl font-bold leading-tight tracking-normal sm:text-4xl'>
          {question.question}
        </h2>

        <div className='mt-7 grid gap-3'>
          {question.options.map((option, index) => {
            const isSelected = option.id === selectedOptionId;
            const isSelectedAnswer = option.id === answer?.selectedOptionId;
            const tone = answer
              ? option.isCorrect
                ? 'border-primary/60 bg-primary/15 text-primary'
                : isSelectedAnswer
                  ? 'border-error/60 bg-error/15 text-error'
                  : 'border-outline-variant/20 text-on-surface-variant'
              : isSelected
                ? 'border-primary/70 bg-primary/15 text-primary'
                : 'border-outline-variant/25 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

            return (
              <button
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-4 text-left text-sm font-semibold leading-6 transition disabled:cursor-default ${tone}`}
                disabled={Boolean(answer)}
                key={option.id}
                onClick={() => onChoose(option.id)}
                type='button'
              >
                <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current/30 text-xs font-bold'>
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>

        {answer && (
          <p aria-live='polite' className={`mt-5 text-sm font-bold ${answer.isCorrect ? 'text-primary' : 'text-error'}`}>
            {answer.isCorrect ? 'Correct. Keep moving.' : 'Not quite. The correct answer is highlighted.'}
          </p>
        )}

        <button
          className='mt-5 flex w-full cursor-pointer items-center justify-between rounded-lg bg-primary px-5 py-4 text-sm font-bold text-surface transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45'
          disabled={!answer && !selectedOptionId}
          onClick={answer ? onNext : onSubmit}
          type='button'
        >
          {answer
            ? questionNumber === session.questions.length
              ? 'Finish test'
              : 'Next question'
            : 'Check answer'}
          <StudyIcon className='h-4 w-4' name='arrow' />
        </button>
      </div>
    </section>
  );
}

export function TestCompleteView({
  onDashboard,
  onStartAgain,
  session,
}: {
  onDashboard: () => void;
  onStartAgain: () => void;
  session: TestSession;
}) {
  const correctCount = session.answers.filter((answer) => answer.isCorrect).length;
  const percent = Math.round((correctCount / session.questions.length) * 100);

  return (
    <section className='mx-auto max-w-2xl rounded-lg border border-primary/25 bg-surface-container-low/90 p-7 text-center shadow-2xl sm:p-12'>
      <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary'>
        <StudyIcon className='h-8 w-8' name='check' />
      </span>
      <p className='mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary'>Test complete</p>
      <h1 className='mt-3 font-display text-5xl font-bold tracking-normal'>{percent}%</h1>
      <p className='mt-4 text-base leading-7 text-on-surface-variant'>
        You answered {correctCount} of {session.questions.length} questions correctly. Test results do
        not change your flashcard confidence scores.
      </p>
      <div className='mt-7 grid gap-3 sm:grid-cols-2'>
        <button
          className='cursor-pointer rounded-lg bg-primary px-5 py-4 text-sm font-bold text-surface transition hover:bg-primary/90'
          onClick={onStartAgain}
          type='button'
        >
          Generate another test
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
