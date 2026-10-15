// Jest tourne sous Node, sans navigateur : ce faux localStorage en mémoire remplace celui du
// navigateur pour le store du profil. À importer avant le store (les imports s'exécutent dans
// l'ordre).
const items = new Map();

globalThis.localStorage = {
  getItem: (key) => (items.has(key) ? items.get(key) : null),
  setItem: (key, value) => items.set(key, String(value)),
  removeItem: (key) => items.delete(key),
  clear: () => items.clear(),
};
