// Faux localStorage pour Jest, à importer avant le store.
const items = new Map();

globalThis.localStorage = {
  getItem: (key) => (items.has(key) ? items.get(key) : null),
  setItem: (key, value) => items.set(key, String(value)),
  removeItem: (key) => items.delete(key),
  clear: () => items.clear(),
};
