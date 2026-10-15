// Écriture compacte d'un script d'IA (rules.md 7.1) : chaque vague est [instant, espèce, nombre],
// l'instant en secondes depuis le début de la phase. Donne une entrée { time, species } par
// unité, dans l'ordre des vagues — qui doivent donc être triées par instant croissant.
export function waves(...list) {
  return list.flatMap(([time, species, count]) => Array.from({ length: count }, () => ({ time, species })));
}
