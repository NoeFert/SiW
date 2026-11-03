// Textes affichés au joueur, regroupés pour une traduction future.
function gems(amount) {
  return `${amount} ${amount > 1 ? 'gemmes obscures' : 'gemme obscure'}`;
}

export const TEXT = {
  title: { first: 'Sovereign', middle: 'in', last: 'War' },
  introLines: [
    'Tu es un souverain.',
    'Un être au sommet de ton espèce.',
    'Ton but ultime : mener tes fidèles',
    'vers la grandeur.',
    'Mais en ce monde, plusieurs souverains existent.',
    'Pour atteindre ton but, il y aura la guerre.',
  ],
  start: 'Commencer',

  prologue: {
    paragraphs: [
      'En ces temps sombres, la terre rocheuse est agitée de tremblements. Deux souverains voient le jour.',
      'Le territoire est unique, seul l\'un d\'eux pourra le posséder.',
    ],
    // `speaker` : faction qui parle.
    dialogue: [
      { speaker: 'wyrms', text: 'Je prendrai ce domaine.' },
      { speaker: 'undead', text: 'Essaie donc, il sera mien avant le coucher du soleil.' },
      { speaker: 'wyrms', text: 'Et avec quoi ? Des ossements décrépits ?' },
      { speaker: 'undead', text: 'On verra qui l\'emportera !' },
      { speaker: 'wyrms', text: 'Tu seras notre premier festin !' },
    ],
  },

  // Clés = champ `message` des étapes (src/data/tutorials.js).
  tutorial: {
    deploy: 'Déploie ta 1ère unité.',
    autonomous: 'Ton unité va combattre d\'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d\'autres au corps-à-corps.',
    presence: 'Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées !',
    flee: 'Tu peux donner des ordres à tes unités. Essaie de faire battre en retraite l\'une d\'entre elles.',
    fleeUnit: 'Clique ensuite sur l\'unité à qui tu veux donner cet ordre.',

    continue: 'Continuer',
  },

  report: {
    lost: 'Unités perdues',
    noLosses: 'Aucune perte !',
  },

  defaultArmyName: 'Armée 1',
  fountainTooltip: (amount) => `Cette statue génère ${gems(amount)} par minute. Puisse le souverain faire bon usage de cette ressource précieuse.`,
  spiritStones: (amount) => gems(amount),
  levels: {
    badge: (level) => `niv ${level}`,
    range: (min, max) => (min === max ? `niv ${min}` : `niv ${min}-${max}`),
    player: (level) => `Niveau ${level}`,
    xp: (xpInLevel, xpForLevel) => `${xpInLevel} / ${xpForLevel} XP`,
    max: 'MAX',
    levelUps: 'Montées de niveau',
    levelUp: (from, to) => `niv ${from} → ${to}`,
  },
  sovereignName: {
    wyrms: 'Souveraine des Wyrms',
    undead: 'Souverain des Morts-Vivants',
  },
  home: {
    goToWar: 'Partir en guerre',
    units: (faction, count) => `${faction} (${count})`,
    army: 'Gestion d\'armée',
    summon: 'Invocation',
  },
  homeTips: {
    welcome: 'Voici ton noble domaine, le territoire de ton peuple.\nL\'ennemi continue cependant son invasion, repousse-le !',
    summon: 'En tant que souverain, tu possèdes un pouvoir puissant : fais grandir ton peuple en invoquant de nouvelles créatures.',
    armyRecruit: 'Ta recrue n\'est pas encore dans ton armée. Ajoute-la avant de repartir.',
    close: 'Fermer',
  },
  settings: {
    title: 'Paramètres',
    codex: 'Codex des mots-clés',
    resetGame: 'Réinitialiser le jeu',
    resetTitle: 'Réinitialiser le jeu ?',
    resetDescription: 'Toute ta progression sera perdue : unités, armée, gemmes obscures et niveaux.',
    resetCancel: 'Annuler',
    resetConfirm: 'Réinitialiser',
  },
  civilization: {
    previous: 'Unité précédente',
    next: 'Unité suivante',
    stats: {
      hp: 'PV',
      damage: 'Dégâts',
      attackType: 'Attaque',
      size: 'Taille',
      moveSpeed: 'Vitesse de déplacement',
      attackSpeed: 'Vitesse d\'attaque',
      range: 'Portée',
      cost: 'Coût',
    },
    attackTypes: { melee: 'Corps-à-corps', ranged: 'À distance', hybrid: 'Hybride' },
    hybridDamage: (damage) => `${damage.ranged} (distance) / ${damage.melee} (corps-à-corps)`,
    size: (size) => (size === 1 ? '1 case' : `${size * size} cases (${size}×${size})`),
    moveSpeed: (speed) => `${formatDecimal(speed)} case/s`,
    attackSpeed: (seconds) => `${formatDecimal(seconds)} s`,
    range: (range) => (range === null ? '—' : `${range} cases`),
    abilities: 'Aptitudes',
    army: 'Gestion d\'armée',
    armyCost: (cost, cap) => `${cost} / ${cap} PP`,
    // Espaces insécables : au plus deux lignes.
    armySummary: (inArmy, owned) => `${inArmy} / ${owned} dans l'armée`,
    removeOne: "Retirer un individu de l'armée",
    addOne: "Ajouter un individu à l'armée",
    rename: 'Renommer',
    confirmRename: 'Valider',
  },
  summon: {
    title: 'Invocation',
    confirmResummon: (name, level, price) => `Réinvoquer ${name} niveau ${level} pour ${gems(price)} ?`,
    keptLevel: 'Niveau gardé :',
    levelPrice: (level, price) => `niv ${level} — ${price}`,
    less: 'Invoquer un individu de moins',
    more: 'Invoquer un individu de plus',
  },
  // Noms des batailles provisoires.
  war: {
    title: 'Partir en guerre',
    battleNames: {
      battleStartW01: 'La passe', battleLow1W01: 'Les crevasses', battleLow2W01: 'La citadelle', battleTop1W01: "L'essaim", battleMid1W01: 'Le labyrinthe',
    },
    upcoming: 'À venir',
    xp: 'XP',
    xpRange: (min, max) => `${min}–${max}`,
    states: { locked: 'Verrouillée', available: 'Disponible', won: 'Gagnée' },
    fight: 'Combattre',
    emptyArmy: 'Composez votre armée',
    completed: "D'autres terres à conquérir arrivent bientôt…",
    invaders: (repelled, total) => `Repousse l'envahisseur ${repelled}/${total}`,
  },
  defeat: {
    title: 'Défaite',
    draw: 'Match nul',
    retry: 'Réessayer',
    home: "Retour à l'accueil",
  },
  // Clé = résultat de summonAction.
  summonActions: {
    summon: 'Invoquer',
    resummon: 'Réinvoquer',
  },
  abilityDescriptions: {
    'Attaque dévastatrice': 'Toutes les 5 attaques (distance et corps-à-corps confondus), la 5e inflige +100 % de dégâts (60 à distance / 90 au corps-à-corps).',
    'Frappe paralysante': 'Toutes les 4 attaques, la cible touchée voit ses 2 prochaines attaques annulées.',
    'Soif de sang': 'Chaque fois qu\'il porte le coup fatal à un ennemi, il régénère 40 PV (sans dépasser ses PV max).',
  },

  chooseFaction: 'Choisis ta faction',
  factions: { wyrms: 'Wyrms', undead: 'Morts-Vivants' },
  factionDescriptions: {
    wyrms: 'Créatures draconiques puissantes et très agressives qui sèmeront la dévastation',
    undead: 'Squelettes et nécromanciens, misant sur la quantité et le debuff pour anéantir leurs ennemis',
  },

  yourUnits: 'Vos unités',
  ungroupSpecies: 'Séparer les individus',
  groupSpecies: 'Regrouper l\'espèce',
  presenceTag: (cost) => `${cost} PP`,
  notEnoughPresence: 'Pas assez de points de présence. Libérez de la place sur le terrain pour déployer cette unité.',
  deployRefused: {
    invalidPosition: 'Déposez l\'unité sur une case libre de votre moitié du terrain.',
    presenceCapExceeded: 'Pas assez de points de présence.',
    legendaryAlreadyDeployed: 'Une seule unité légendaire à la fois sur le terrain.',
    noCopiesLeft: 'Plus aucune copie disponible.',
  },

  fieldTexts: {
    criticalHit: 'COUP CRITIQUE !', // Fafnir
    missed: 'Raté !', // Athos
    heal: (amount) => `+${amount}`,
  },

  ordersTitle: 'Ordres',
  cancel: 'Annuler',
  back: 'Retour',
  orders: { move: 'Aller', attack: 'Attaquer', flee: 'Fuir' },
  fleeCooldown: (seconds) => `Fuir (${seconds.toFixed(1)} s)`,

  pause: 'Pause (Espace)',
  resume: 'Reprendre (Espace)',

  surrender: 'Abandonner',
  surrenderTitle: 'Abandonner la bataille ?',
  surrenderDescription: 'Vos unités en réserve seront conservées.',
  surrenderCancel: 'Continuer',

  // Clé = `species.name`.
  unitNames: {
    'Lambton Worm': 'Ver de Lambton',
  },
  keywords: {
    melee: 'Corps-à-corps',
    ranged: 'Tirs',
    legendary: 'Légendaire',
    flying: 'Vol',
  },
  keywordEffects: {
    melee: 'Frappe au contact : l\'unité va au contact de l\'ennemi le plus proche et l\'attaque depuis une case adjacente. Une fois engagée, elle ne change pas de cible tant que l\'ennemi n\'est pas mort.',
    ranged: 'Tire à distance sur l\'ennemi dès qu\'il est à portée. Ne peut pas tirer sur une cible collée à elle : une unité qui ne fait que tirer recule alors pour se remettre à distance.',
    legendary: 'Tu ne possèdes qu\'une seule unité légendaire, et une seule peut être sur le terrain à la fois. Morte, elle peut être réinvoquée jusqu\'au niveau qu\'elle avait à sa mort.',
    flying: 'Survole les rochers d\'une case et peut s\'arrêter au-dessus. Les gros rochers et les autres unités lui barrent toujours le passage.',
  },
};

// Décimal à la française (« 1,0 s »).
function formatDecimal(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1 });
}

export function unitName(species) {
  return TEXT.unitNames[species.name] ?? species.name;
}

const ATTACK_TAGS = { melee: ['melee'], ranged: ['ranged'], hybrid: ['melee', 'ranged'] };
export function keywordLabels({ attackType, keywords }) {
  return [...ATTACK_TAGS[attackType], ...keywords].map((keyword) => TEXT.keywords[keyword]);
}
