import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDeck } from './deck';
import {
  advanceTestSession,
  answerCurrentTestQuestion,
  createSprintSession,
  createTestSession,
  getStudyShortcut,
  moveToNextQueuedCard,
  moveToPreviousQueuedCard,
  rateCurrentCard,
} from './studySessions';

function createSampleDeck(count = 7) {
  return createDeck(
    'Sample',
    Array.from({ length: count }, (_, index) => ({
      sourceId: `${index + 1}`,
      unit: 'Unit 1',
      question: `Question ${index + 1}?`,
      answer: `Distinct answer ${index + 1}`,
    })),
  );
}

describe('focus sprint workflow', () => {
  it('loops Again and Hard ratings back into the queue', () => {
    const deck = createSampleDeck();
    const session = createSprintSession(deck.cards, deck.cards.length);
    const currentCardId = session.queue[0];

    const again = rateCurrentCard(deck, session, currentCardId, 'again');
    assert.ok(again);
    assert.equal(again.session.queue[2], currentCardId);
    assert.equal(again.session.reviews, 1);

    const hard = rateCurrentCard(deck, session, currentCardId, 'hard');
    assert.ok(hard);
    assert.equal(hard.session.queue[5], currentCardId);
  });

  it('completes a one-card sprint after a confident answer', () => {
    const deck = createSampleDeck(1);
    const session = createSprintSession(deck.cards, 1);
    const result = rateCurrentCard(deck, session, session.queue[0], 'got-it');

    assert.ok(result);
    assert.deepEqual(result.session.queue, []);
    assert.equal(result.session.streak, 1);
    assert.equal(result.session.bestStreak, 1);
    assert.equal(result.deck.cards[0].confidence, 1);
    assert.equal(result.deck.cards[0].correct, 1);
  });

  it('moves forward and backward through the sprint queue without changing progress', () => {
    const deck = createSampleDeck(4);
    const session = createSprintSession(deck.cards, 4);
    const originalQueue = session.queue;

    const next = moveToNextQueuedCard(session);
    assert.deepEqual(next.queue, [...originalQueue.slice(1), originalQueue[0]]);
    assert.equal(next.reviews, 0);

    const previous = moveToPreviousQueuedCard(next);
    assert.deepEqual(previous.queue, originalQueue);
    assert.equal(previous.reviews, 0);
  });
});

describe('keyboard shortcuts', () => {
  it('maps the study keys and ignores unrelated input', () => {
    assert.equal(getStudyShortcut({ code: 'Space', key: ' ' }), 'flip');
    assert.equal(getStudyShortcut({ code: 'ArrowRight', key: 'ArrowRight' }), 'next');
    assert.equal(getStudyShortcut({ code: 'ArrowLeft', key: 'ArrowLeft' }), 'previous');
    assert.equal(getStudyShortcut({ code: 'Digit1', key: '1' }), 'again');
    assert.equal(getStudyShortcut({ code: 'Digit2', key: '2' }), 'hard');
    assert.equal(getStudyShortcut({ code: 'Digit3', key: '3' }), 'got-it');
    assert.equal(getStudyShortcut({ code: 'KeyA', key: 'a' }), null);
  });
});

describe('multiple-choice workflow', () => {
  it('records an answer and advances to the next question', () => {
    const session = createTestSession(createSampleDeck(4).cards, 4);
    assert.ok(session);

    const option = session.questions[0].options.find((item) => item.isCorrect);
    assert.ok(option);
    const answered = answerCurrentTestQuestion(session, option.id);
    assert.ok(answered);
    assert.equal(answered.answers[0].isCorrect, true);

    const advanced = advanceTestSession(answered);
    assert.ok(advanced);
    assert.equal(advanced.isComplete, false);
    assert.equal(advanced.session.currentIndex, 1);
  });
});
