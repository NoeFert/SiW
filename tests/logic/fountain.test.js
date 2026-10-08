import {
  FOUNTAIN_MINUTE_MS, fountainCapacity, fountainContent, harvestFountain,
} from '../../src/logic/fountain.js';

const MIN = FOUNTAIN_MINUTE_MS;
const T0 = 1_000_000_000_000;

describe('Spirit Fountain — capacité (rules.md 11.8)', () => {
  test('80 + 10 × niveau du joueur', () => {
    expect(fountainCapacity(1)).toBe(90);
    expect(fountainCapacity(3)).toBe(110);
    expect(fountainCapacity(10)).toBe(180);
  });
});

describe('Spirit Fountain — production (rules.md 11.8)', () => {
  test('vide à la mise en route', () => {
    expect(fountainContent(T0, T0, 90)).toBe(0);
  });

  test('3 Spirit Stones par minute entière écoulée', () => {
    expect(fountainContent(T0, T0 + MIN - 1, 90)).toBe(0);
    expect(fountainContent(T0, T0 + MIN, 90)).toBe(3);
    expect(fountainContent(T0, T0 + 12.5 * MIN, 90)).toBe(36);
  });

  test('plafonnée à la capacité', () => {
    expect(fountainContent(T0, T0 + 1000 * MIN, 90)).toBe(90);
    expect(fountainContent(T0, T0 + 34 * MIN, 100)).toBe(100); // 102 plafonné, capacité pas multiple de 3
  });

  test('pleine en 30 minutes au niveau 1 (filet anti-blocage)', () => {
    expect(fountainContent(T0, T0 + 30 * MIN, fountainCapacity(1))).toBe(90);
  });

  test('la capacité est celle du niveau actuel', () => {
    expect(fountainContent(T0, T0 + 35 * MIN, fountainCapacity(1))).toBe(90);
    expect(fountainContent(T0, T0 + 35 * MIN, fountainCapacity(3))).toBe(105);
  });

  test('horloge reculée : jamais négatif', () => {
    expect(fountainContent(T0, T0 - 10 * MIN, 90)).toBe(0);
  });
});

describe('Spirit Fountain — récolte (rules.md 11.8)', () => {
  test('récolte tout le contenu ; la minute entamée est conservée', () => {
    const { collected, lastHarvestMs } = harvestFountain(T0, T0 + 12.5 * MIN, 90);
    expect(collected).toBe(36);
    expect(lastHarvestMs).toBe(T0 + 12 * MIN);
    expect(fountainContent(lastHarvestMs, T0 + 13 * MIN, 90)).toBe(3); // la demi-minute compte
  });

  test('pleine : le surplus est perdu, la production repart de la récolte', () => {
    const now = T0 + 100 * MIN;
    const { collected, lastHarvestMs } = harvestFountain(T0, now, 90);
    expect(collected).toBe(90);
    expect(lastHarvestMs).toBe(now);
  });

  test('pleine avec une capacité qui n\'est pas un multiple de 3 : la production repart de la récolte', () => {
    const now = T0 + 34 * MIN;
    expect(harvestFountain(T0, now, 100)).toEqual({ collected: 100, lastHarvestMs: now });
  });

  test('presque pleine : la récolte avance d\'un nombre entier de minutes', () => {
    const { collected, lastHarvestMs } = harvestFountain(T0, T0 + 33.5 * MIN, 100);
    expect(collected).toBe(99);
    expect(lastHarvestMs).toBe(T0 + 33 * MIN);
  });

  test('vide : sans effet', () => {
    expect(harvestFountain(T0, T0 + 30 * 1000, 90)).toEqual({ collected: 0, lastHarvestMs: T0 });
  });
});
