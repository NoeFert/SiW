import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { getOwnedUnits } from '../persistence.js';

const CROWD_SIZE = 3;
const PICK_INTERVAL_MS = 5 * 60 * 1000;
const SPEED = 3; // en % de la largeur du couloir par seconde
const OUTSIDE_LEFT = -6; // positions (en %) hors de l'écran, pour entrer et sortir
const OUTSIDE_RIGHT = 106;
const randomBetween = (min, max) => min + Math.random() * (max - min);

// Jusqu'à 3 individus différents, tirés au hasard parmi les individus possédés d'une case (1×1) :
// leurs espèces. Liste vide s'il n'y en a pas.
function pickCrowd(roster) {
  const candidates = (getOwnedUnits() ?? []).filter((unit) => roster[unit.species].size === 1);
  const picked = [];
  while (picked.length < CROWD_SIZE && candidates.length > 0) {
    picked.push(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]);
  }
  return picked.map((unit) => roster[unit.species]);
}

// Une unité qui erre : elle entre par un bord, va et vient au hasard dans le couloir (pauses de 1
// à 4 s entre deux trajets), et sort par le bord le plus proche quand `leaving` passe à vrai —
// puis `onLeft`. Elle regarde dans le sens de sa marche ; un clic la fait sursauter.
function Wanderer({ species, leaving, onLeft }) {
  const { key, facing } = SPECIES_SPRITES[species.name];
  const [move, setMove] = useState(() => ({
    x: Math.random() < 0.5 ? OUTSIDE_LEFT : OUTSIDE_RIGHT, duration: 0, towardsLeft: true,
  }));
  const buttonRef = useRef(null);
  const spriteRef = useRef(null);
  const pause = useRef(null);
  const leavingRef = useRef(leaving);

  // Position actuelle (en %), y compris en plein trajet : lue sur la mise en page. `left` est le
  // centre de l'unité (elle est recentrée par -translate-x-1/2, ignoré par offsetLeft).
  const moveTo = useCallback((target) => {
    const button = buttonRef.current;
    const from = (button.offsetLeft / button.parentElement.offsetWidth) * 100;
    setMove({ x: target, duration: (Math.abs(target - from) / SPEED) * 1000, towardsLeft: target < from });
  }, []);

  useEffect(() => {
    // Laisse le navigateur placer l'unité hors de l'écran avant son entrée.
    const frame = requestAnimationFrame(() => moveTo(randomBetween(5, 95)));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(pause.current);
    };
  }, [moveTo]);

  useEffect(() => {
    leavingRef.current = leaving;
    if (!leaving) return;
    clearTimeout(pause.current);
    const button = buttonRef.current;
    const onLeftHalf = button.offsetLeft < button.parentElement.offsetWidth / 2;
    moveTo(onLeftHalf ? OUTSIDE_LEFT : OUTSIDE_RIGHT);
  }, [leaving, moveTo]);

  const arrived = (event) => {
    if (event.propertyName !== 'left') return;
    if (leavingRef.current) {
      onLeft();
      return;
    }
    pause.current = setTimeout(() => moveTo(randomBetween(5, 95)), randomBetween(1000, 4000));
  };

  const jump = () => spriteRef.current?.animate(
    [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-24px)', offset: 0.4 },
      { transform: 'translateY(0)' },
    ],
    { duration: 350, easing: 'ease-out' },
  );

  // Sprite retourné quand il marche dans le sens opposé à son dessin d'origine.
  const flipped = facing !== null && (facing === 'right') === move.towardsLeft;
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={jump}
      onTransitionEnd={arrived}
      className="pointer-events-auto absolute bottom-0 size-14.5 -translate-x-1/2 cursor-pointer"
      style={{ left: `${move.x}%`, transition: `left ${move.duration}ms linear` }}
    >
      <img
        ref={spriteRef}
        src={spritePath(key)}
        alt=""
        draggable={false}
        className={`pixelated size-full object-contain ${flipped ? '-scale-x-100' : ''}`}
      />
    </button>
  );
}

// GRAPHICS.md « Accueil » : jusqu'à 3 unités du joueur errent en bas de l'accueil, à la hauteur
// de la Spirit Fountain. Toutes les 5 minutes, elles sortent de l'écran et un nouveau groupe,
// tiré au hasard, entre ; aucune si le joueur n'a pas d'individu d'une case.
export default function HomeWanderer({ playerFaction }) {
  const roster = ROSTERS[playerFaction];
  const [crowd, setCrowd] = useState(() => ({ id: 0, species: pickCrowd(roster) }));
  const [leaving, setLeaving] = useState(false);
  const leftCount = useRef(0);
  const crowdRef = useRef(crowd);
  crowdRef.current = crowd;

  const renew = useCallback(() => {
    leftCount.current = 0;
    setLeaving(false);
    setCrowd((current) => ({ id: current.id + 1, species: pickCrowd(roster) }));
  }, [roster]);

  useEffect(() => {
    const id = setInterval(() => {
      // Personne à l'écran : nouveau tirage direct ; sinon, on attend que tous soient sortis.
      if (crowdRef.current.species.length === 0) renew();
      else setLeaving(true);
    }, PICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [renew]);

  const onLeft = useCallback(() => {
    leftCount.current += 1;
    if (leftCount.current >= crowdRef.current.species.length) renew();
  }, [renew]);

  if (crowd.species.length === 0) return null;
  return (
    // Couloir sur toute la largeur de la fenêtre (padding du jeu compris), en bas de l'accueil.
    // Découpé sur les côtés seulement (unités hors écran cachées), pas en haut : le sursaut dépasse.
    <div className="pointer-events-none absolute -right-game -bottom-0.5 -left-game h-14.5 overflow-x-clip">
      {crowd.species.map((species, i) => (
        <Wanderer key={`${crowd.id}-${i}`} species={species} leaving={leaving} onLeft={onLeft} />
      ))}
    </div>
  );
}
