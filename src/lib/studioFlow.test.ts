import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INITIAL_STUDIO_FLOW, studioFlowReducer } from './studioFlow';
import type { Session, TestSession } from './studySessions';

const ACTIVE_SESSION: Session = {
  queue: ['1'],
  startingCount: 1,
  reviews: 0,
  streak: 0,
  bestStreak: 0,
};

const TEST_SESSION: TestSession = {
  questions: [],
  currentIndex: 0,
  answers: [],
};

describe('studio flow reducer', () => {
  it('only flips cards during a study sprint', () => {
    assert.equal(studioFlowReducer(INITIAL_STUDIO_FLOW, { type: 'flip-card' }).isFlipped, false);

    const studying = studioFlowReducer(INITIAL_STUDIO_FLOW, {
      type: 'start-sprint',
      session: ACTIVE_SESSION,
    });
    assert.equal(studioFlowReducer(studying, { type: 'flip-card' }).isFlipped, true);
  });

  it('moves completed sprints to the completion screen', () => {
    const completed = studioFlowReducer(INITIAL_STUDIO_FLOW, {
      type: 'rate-card',
      session: { ...ACTIVE_SESSION, queue: [] },
    });

    assert.equal(completed.view, 'complete');
  });

  it('clears stale workflow state when a deck is replaced', () => {
    const testing = studioFlowReducer(INITIAL_STUDIO_FLOW, {
      type: 'start-test',
      session: TEST_SESSION,
    });
    const selected = studioFlowReducer(testing, {
      type: 'choose-test-option',
      optionId: 'answer-1',
    });

    assert.deepEqual(studioFlowReducer(selected, { type: 'replace-deck' }), INITIAL_STUDIO_FLOW);
  });
});
