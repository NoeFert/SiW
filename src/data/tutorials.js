// Tutoriels, déroulés par src/logic/battles/tutorial.js.
// `requires` : toutes pour entrer ; `next` : une seule pour passer.

export const STARTER_TUTORIAL = [
  {
    id: 'deploy',
    frozen: true,
    allows: ['deploy'],
    message: 'deploy',
    hand: ['basicUnitRow', 'deploymentZone'],
    next: [{ type: 'playerUnitOnField' }],
  },
  {
    id: 'autonomous',
    frozen: false,
    allows: null,
    message: 'autonomous',
    messageSeconds: 5,
    continueButton: true,
    next: [{ type: 'elapsed', seconds: 8 }],
  },
  {
    id: 'presence',
    frozen: true,
    allows: [],
    message: 'presence',
    continueButton: true,
    hand: ['presenceGauge', 'basicUnitPresenceTag'],
    next: [{ type: 'continueClicked' }],
  },
  {
    // Pas de message, 8 s au plus.
    id: 'waitingForWave',
    frozen: false,
    allows: null,
    next: [{ type: 'enemyWaveDeployed', fromEnd: 2 }, { type: 'elapsed', seconds: 8 }],
  },
  {
    id: 'flee',
    frozen: true,
    allows: ['order:flee'],
    message: 'flee',
    hand: ['fleeOrder'],
    requires: [{ type: 'playerUnitOnField' }, { type: 'fleeAvailable' }, { type: 'noGestureInProgress' }],
    next: [{ type: 'fleeOrderChosen' }],
  },
  {
    // Fuir annulé : retour au bouton Fuir.
    id: 'fleeUnit',
    frozen: true,
    allows: ['selectUnit:flee'],
    message: 'fleeUnit',
    hand: ['weakestPlayerUnit'],
    next: [{ type: 'fleeIssued' }],
    back: { when: { type: 'noOrderChosen' }, to: 'flee' },
  },
];
