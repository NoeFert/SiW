import fs from 'node:fs';
import path from 'node:path';
import { FACTIONS } from '../../src/data/factions/index.js';
import { PALETTE_FILES, themeVariables, uiAsset } from '../../src/ui/factionTheme.js';

// assets/ est servi à la racine du site : /ui/... correspond à assets/ui/...
const assetExists = (url) => fs.existsSync(path.join('assets', url));

describe('thème des factions (src/ui/factionTheme.js)', () => {
  test.each(Object.values(FACTIONS))('$id : couleur principale en hexadécimal, palette complète', (faction) => {
    expect(faction.color).toMatch(/^#[0-9a-f]{6}$/i);
    for (const name of PALETTE_FILES) expect(assetExists(uiAsset(name, faction.uiColor))).toBe(true);
  });

  test.each(Object.values(FACTIONS))('$id : chaque image du thème existe', (faction) => {
    const urls = Object.values(themeVariables(faction))
      .map((value) => value.match(/^url\("(.+)"\)$/)?.[1])
      .filter(Boolean);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(assetExists(url)).toBe(true);
  });
});

// Toute image d'interface écrite en dur dans le code (CSS ou JS) existe bien dans assets/ui/.
test('chemins /ui/… du code : tous présents dans assets/ui/', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|css)$/.test(entry.name)) files.push(full);
    }
  };
  walk('src');
  const urls = files.flatMap((file) => fs.readFileSync(file, 'utf8').match(/\/ui\/[\w/-]+\.png/g) ?? []);
  expect(urls.length).toBeGreaterThan(10);
  for (const url of new Set(urls)) expect([url, assetExists(url)]).toEqual([url, true]);
});

// Les autres assets cités par les données de faction existent aussi.
test.each(Object.values(FACTIONS))('$id : sprite du souverain et missile présents dans assets/', (faction) => {
  expect(fs.existsSync(path.join('assets', 'sprites', `${faction.sovereignSprite}.png`))).toBe(true);
  expect(fs.existsSync(path.join('assets', faction.projectile.path))).toBe(true);
  expect(faction.projectile.impactColor).toEqual(expect.any(Number));
});
