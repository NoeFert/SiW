// Vague : [instant, espèce, nombre], triées par instant.
export function waves(...list) {
  return list.flatMap(([time, species, count]) => Array.from({ length: count }, () => ({ time, species })));
}
