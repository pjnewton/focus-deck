import type { Session } from './studySessions';

export type View = 'dashboard' | 'study' | 'browse' | 'complete';

export type StudioFlow = {
  view: View;
  session: Session | null;
  isFlipped: boolean;
};

export const INITIAL_STUDIO_FLOW: StudioFlow = {
  view: 'dashboard',
  session: null,
  isFlipped: false,
};

export type StudioFlowAction =
  | { type: 'replace-deck' }
  | { type: 'open-dashboard' }
  | { type: 'open-browse' }
  | { type: 'start-sprint'; session: Session }
  | { type: 'flip-card' }
  | { type: 'navigate-card'; session: Session }
  | { type: 'rate-card'; session: Session };

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
  }
}
