import { useState, useEffect } from 'react';
import { store } from '../store.js';

export function useStore() {
  const [state, setState] = useState(() => store.getState());

  useEffect(() => {
    return store.subscribe(setState);
  }, []);

  return state;
}
