import { useEffect, useState } from 'react';
import { downloads } from '../downloads.js';

export function useDownloads() {
  const [state, setState] = useState(() => downloads.getState());
  useEffect(() => downloads.subscribe(setState), []);
  return state;
}
