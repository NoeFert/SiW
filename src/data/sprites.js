// `facing` : direction du dessin d'origine, null pour un sprite de face.
export const SPECIES_SPRITES = {
  'Lambton Worm': { key: 'lambton-worm', facing: 'right' },
  Amphiptère: { key: 'ampiptere', facing: 'right' },
  'Fafnir the Cursed One': { key: 'fafnir', facing: 'right' },
  'New-reborn Skeleton': { key: 'new-reborn-skeleton', facing: 'left' },
  'Necromant Initiate': { key: 'necromant', facing: 'left' },
  'Athos the Lord of Pain': { key: 'athos', facing: null },
};

export function spritePath(key) {
  return `sprites/${key}.png`;
}
