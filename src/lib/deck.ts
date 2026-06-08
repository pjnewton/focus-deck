import {
  createFlashcards,
  type Flashcard,
  type FlashcardDraft,
  type FlashcardRating,
} from './flashcards';

export const STORAGE_KEY = 'focus-deck:local:v1';

export const STORAGE_READ_ERROR =
  'Your saved local deck could not be read. Import the PDF again to rebuild it.';
export const STORAGE_VERSION_ERROR =
  'Your saved local deck uses an unsupported version. Import the PDF again to rebuild it.';
export const STORAGE_WRITE_ERROR =
  'Your latest changes could not be saved in this browser. Keep this tab open and check your local storage settings.';

export type Deck = {
  version: 1;
  name: string;
  importedAt: string;
  cards: Flashcard[];
};

export type DeckStats = {
  mastered: number;
  learning: number;
  fresh: number;
  reviews: number;
};

export type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRating(value: unknown): value is FlashcardRating {
  return value === 'again' || value === 'hard' || value === 'got-it';
}

function isFlashcard(value: unknown): value is Flashcard {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.sourceId === 'string' &&
    typeof value.unit === 'string' &&
    typeof value.question === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.confidence === 'number' &&
    Number.isInteger(value.confidence) &&
    value.confidence >= 0 &&
    value.confidence <= 4 &&
    typeof value.attempts === 'number' &&
    Number.isInteger(value.attempts) &&
    value.attempts >= 0 &&
    typeof value.correct === 'number' &&
    Number.isInteger(value.correct) &&
    value.correct >= 0 &&
    value.correct <= value.attempts &&
    (value.lastRating === undefined || isRating(value.lastRating))
  );
}

export function isDeck(value: unknown): value is Deck {
  if (!isRecord(value)) return false;

  return (
    value.version === 1 &&
    typeof value.name === 'string' &&
    typeof value.importedAt === 'string' &&
    Array.isArray(value.cards) &&
    value.cards.length > 0 &&
    value.cards.every(isFlashcard)
  );
}

export function loadStoredDeck(storage: StorageLike) {
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (!saved) return { deck: null, error: '' };

    const parsed: unknown = JSON.parse(saved);
    if (isRecord(parsed) && 'version' in parsed && parsed.version !== 1) {
      return { deck: null, error: STORAGE_VERSION_ERROR };
    }
    if (!isDeck(parsed)) return { deck: null, error: STORAGE_READ_ERROR };

    return { deck: parsed, error: '' };
  } catch {
    return { deck: null, error: STORAGE_READ_ERROR };
  }
}

export function persistStoredDeck(storage: StorageLike, deck: Deck | null) {
  try {
    if (deck) {
      storage.setItem(STORAGE_KEY, JSON.stringify(deck));
    } else {
      storage.removeItem(STORAGE_KEY);
    }
    return '';
  } catch {
    return STORAGE_WRITE_ERROR;
  }
}

export function createDeck(
  name: string,
  drafts: FlashcardDraft[],
  importedAt = new Date().toISOString(),
): Deck {
  return {
    version: 1,
    name,
    importedAt,
    cards: createFlashcards(drafts),
  };
}

export function getDeckStats(cards: Flashcard[]): DeckStats {
  return {
    mastered: cards.filter((card) => card.attempts > 0 && card.confidence >= 3).length,
    learning: cards.filter((card) => card.attempts > 0 && card.confidence < 3).length,
    fresh: cards.filter((card) => card.attempts === 0).length,
    reviews: cards.reduce((total, card) => total + card.attempts, 0),
  };
}

export function confidenceLabel(card: Flashcard) {
  if (card.confidence >= 3) return 'Mastered';
  if (card.attempts > 0) return 'Learning';
  return 'Fresh';
}

export function updateDeckCard(deck: Deck, changedCard: Flashcard): Deck {
  return {
    ...deck,
    cards: deck.cards.map((card) => (card.id === changedCard.id ? changedCard : card)),
  };
}

export function resetDeckProgress(deck: Deck): Deck {
  return {
    ...deck,
    cards: deck.cards.map((card) => ({
      ...card,
      confidence: 0,
      attempts: 0,
      correct: 0,
      lastRating: undefined,
    })),
  };
}
