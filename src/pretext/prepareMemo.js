import {prepare} from "./prepare.js";

function useMemo(fn) {
  const cache = new Map();
  const memoized = (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
  const clear = () => cache.clear();
  return [memoized, clear];
}

/** Memoized `prepare` for `layoutTextInPath`. */
export const [prepareMemo, clearPrepareMemo] = useMemo((text, opts) => prepare(text, opts));
