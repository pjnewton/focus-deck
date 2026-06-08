'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  loadStoredDeck,
  persistStoredDeck,
  STORAGE_READ_ERROR,
  STORAGE_WRITE_ERROR,
  type Deck,
  type StorageLike,
} from '@/lib/deck';

function getLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useStoredDeck() {
  const [deck, setDeckState] = useState<Deck | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState('');
  const skipFirstPersistence = useRef(true);

  useEffect(() => {
    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;

      const storage = getLocalStorage();
      if (!storage) {
        setPersistenceError(STORAGE_READ_ERROR);
        setHasHydrated(true);
        return;
      }

      const result = loadStoredDeck(storage);
      setDeckState(result.deck);
      setPersistenceError(result.error);
      setHasHydrated(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (skipFirstPersistence.current) {
      skipFirstPersistence.current = false;
      return;
    }

    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;

      const storage = getLocalStorage();
      setPersistenceError(storage ? persistStoredDeck(storage, deck) : STORAGE_WRITE_ERROR);
    });

    return () => {
      isCancelled = true;
    };
  }, [deck, hasHydrated]);

  const setDeck = useCallback<Dispatch<SetStateAction<Deck | null>>>((value) => {
    setDeckState(value);
  }, []);

  return { deck, hasHydrated, persistenceError, setDeck };
}
