import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDeck,
  loadStoredDeck,
  persistStoredDeck,
  resetDeckProgress,
  STORAGE_KEY,
  STORAGE_READ_ERROR,
  STORAGE_VERSION_ERROR,
  STORAGE_WRITE_ERROR,
  updateDeckCard,
  type StorageLike,
} from './deck';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function createSampleDeck() {
  return createDeck(
    'Sample',
    [
      { sourceId: '1', unit: 'Unit 1', question: 'First?', answer: 'First answer' },
      { sourceId: '2', unit: 'Unit 1', question: 'Second?', answer: 'Second answer' },
      { sourceId: '3', unit: 'Unit 1', question: 'Third?', answer: 'Third answer' },
    ],
    '2026-05-30T00:00:00.000Z',
  );
}

describe('local deck persistence', () => {
  it('round-trips a validated deck through storage', () => {
    const storage = createMemoryStorage();
    const deck = createSampleDeck();

    assert.equal(persistStoredDeck(storage, deck), '');
    assert.deepEqual(loadStoredDeck(storage), { deck, error: '' });
  });

  it('rejects corrupt and unsupported saved decks', () => {
    assert.deepEqual(loadStoredDeck(createMemoryStorage({ [STORAGE_KEY]: '{nope' })), {
      deck: null,
      error: STORAGE_READ_ERROR,
    });
    assert.deepEqual(loadStoredDeck(createMemoryStorage({ [STORAGE_KEY]: JSON.stringify({}) })), {
      deck: null,
      error: STORAGE_READ_ERROR,
    });
    assert.deepEqual(
      loadStoredDeck(createMemoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2 }) })),
      {
        deck: null,
        error: STORAGE_VERSION_ERROR,
      },
    );
  });

  it('reports browser write failures without throwing', () => {
    const storage: StorageLike = {
      getItem: () => null,
      removeItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    assert.equal(persistStoredDeck(storage, createSampleDeck()), STORAGE_WRITE_ERROR);
    assert.equal(persistStoredDeck(storage, null), STORAGE_WRITE_ERROR);
  });
});

describe('deck replacement and editing', () => {
  it('edits one card without losing its review history', () => {
    const deck = createSampleDeck();
    const reviewedCard = { ...deck.cards[0], attempts: 2, confidence: 1, question: 'Updated?' };
    const updated = updateDeckCard(deck, reviewedCard);

    assert.equal(updated.cards[0].question, 'Updated?');
    assert.equal(updated.cards[0].attempts, 2);
    assert.equal(updated.cards[1], deck.cards[1]);
  });

  it('resets progress and builds replacement decks with fresh scores', () => {
    const deck = createSampleDeck();
    deck.cards[0] = { ...deck.cards[0], attempts: 2, correct: 1, confidence: 1, lastRating: 'hard' };

    assert.deepEqual(resetDeckProgress(deck).cards[0], {
      ...deck.cards[0],
      attempts: 0,
      correct: 0,
      confidence: 0,
      lastRating: undefined,
    });

    const replacement = createDeck('Replacement', [
      { sourceId: 'replacement', unit: 'Unit 2', question: 'New?', answer: 'New answer' },
    ]);
    assert.equal(replacement.cards[0].attempts, 0);
    assert.equal(replacement.cards[0].confidence, 0);
  });
});
