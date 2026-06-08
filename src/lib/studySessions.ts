import type { Deck } from './deck';
import {
  orderCardsForSprint,
  type Flashcard,
  type FlashcardRating,
} from './flashcards';

export type Session = {
  queue: string[];
  startingCount: number;
  reviews: number;
  streak: number;
  bestStreak: number;
};

export function createSprintSession(cards: Flashcard[], requestedSize: number): Session {
  const queue = orderCardsForSprint(cards)
    .slice(0, Math.min(requestedSize, cards.length))
    .map((card) => card.id);

  return {
    queue,
    startingCount: queue.length,
    reviews: 0,
    streak: 0,
    bestStreak: 0,
  };
}

export function rateCurrentCard(
  deck: Deck,
  session: Session,
  currentCardId: string,
  rating: FlashcardRating,
) {
  if (session.queue[0] !== currentCardId) return null;

  const updatedCards = deck.cards.map((card) => {
    if (card.id !== currentCardId) return card;
    const confidence =
      rating === 'got-it'
        ? Math.min(4, card.confidence + 1)
        : rating === 'again'
          ? Math.max(0, card.confidence - 1)
          : card.confidence;

    return {
      ...card,
      confidence,
      attempts: card.attempts + 1,
      correct: card.correct + (rating === 'got-it' ? 1 : 0),
      lastRating: rating,
    };
  });

  const queue = session.queue.slice(1);
  if (rating === 'again') {
    queue.splice(Math.min(2, queue.length), 0, currentCardId);
  } else if (rating === 'hard') {
    queue.splice(Math.min(5, queue.length), 0, currentCardId);
  }

  const streak = rating === 'got-it' ? session.streak + 1 : 0;

  return {
    deck: { ...deck, cards: updatedCards },
    session: {
      ...session,
      queue,
      reviews: session.reviews + 1,
      streak,
      bestStreak: Math.max(streak, session.bestStreak),
    },
  };
}

export function moveToNextQueuedCard(session: Session): Session {
  if (session.queue.length <= 1) return session;
  return {
    ...session,
    queue: [...session.queue.slice(1), session.queue[0]],
  };
}

export function moveToPreviousQueuedCard(session: Session): Session {
  if (session.queue.length <= 1) return session;
  return {
    ...session,
    queue: [session.queue[session.queue.length - 1], ...session.queue.slice(0, -1)],
  };
}

export function getStudyShortcut(event: Pick<KeyboardEvent, 'code' | 'key'>) {
  if (event.code === 'Space') return 'flip' as const;
  if (event.key === 'ArrowRight') return 'next' as const;
  if (event.key === 'ArrowLeft') return 'previous' as const;
  if (event.key === '1') return 'again' as const;
  if (event.key === '2') return 'hard' as const;
  if (event.key === '3') return 'got-it' as const;
  return null;
}
