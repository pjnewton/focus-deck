import type { Session, TestSession } from './studySessions';

export type View = 'dashboard' | 'study' | 'browse' | 'complete' | 'test' | 'test-complete';

export type StudioFlow = {
  view: View;
  session: Session | null;
  testSession: TestSession | null;
  isFlipped: boolean;
  selectedTestOptionId: string;
};

export const INITIAL_STUDIO_FLOW: StudioFlow = {
  view: 'dashboard',
  session: null,
  testSession: null,
  isFlipped: false,
  selectedTestOptionId: '',
};

export type StudioFlowAction =
  | { type: 'replace-deck' }
  | { type: 'open-dashboard' }
  | { type: 'open-browse' }
  | { type: 'start-sprint'; session: Session }
  | { type: 'flip-card' }
  | { type: 'navigate-card'; session: Session }
  | { type: 'rate-card'; session: Session }
  | { type: 'start-test'; session: TestSession }
  | { type: 'choose-test-option'; optionId: string }
  | { type: 'answer-test'; session: TestSession }
  | { type: 'advance-test'; session: TestSession; isComplete: boolean };

export function studioFlowReducer(state: StudioFlow, action: StudioFlowAction): StudioFlow {
  switch (action.type) {
    case 'replace-deck':
    case 'open-dashboard':
      return INITIAL_STUDIO_FLOW;
    case 'open-browse':
      return { ...INITIAL_STUDIO_FLOW, view: 'browse' };
    case 'start-sprint':
      return { ...INITIAL_STUDIO_FLOW, view: 'study', session: action.session };
    case 'flip-card':
      return state.view === 'study' ? { ...state, isFlipped: !state.isFlipped } : state;
    case 'navigate-card':
      return state.view === 'study' ? { ...state, session: action.session, isFlipped: false } : state;
    case 'rate-card':
      return {
        ...INITIAL_STUDIO_FLOW,
        view: action.session.queue.length === 0 ? 'complete' : 'study',
        session: action.session,
      };
    case 'start-test':
      return { ...INITIAL_STUDIO_FLOW, view: 'test', testSession: action.session };
    case 'choose-test-option':
      return state.view === 'test' && state.testSession
        ? { ...state, selectedTestOptionId: action.optionId }
        : state;
    case 'answer-test':
      return state.view === 'test' ? { ...state, testSession: action.session } : state;
    case 'advance-test':
      return {
        ...state,
        view: action.isComplete ? 'test-complete' : 'test',
        testSession: action.session,
        selectedTestOptionId: '',
      };
  }
}
