import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { FACTIONS } from '../data/factions/index.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import { useProfileStore } from '../state/profileStore.js';

const CROWD_SIZE = 3;
const PICK_INTERVAL_MS = 5 * 60 * 1000;
const ENTRY_GAP_MS = 2000;
const SPEED = 3; // % de la largeur par seconde
const OUTSIDE_LEFT = -6;
const OUTSIDE_RIGHT = 106;
const randomBetween = (min, max) => min + Math.random() * (max - min);

// Jusqu'à 3 espèces tirées parmi les individus d'une case.
function pickCrowd(roster) {
  const candidates = useProfileStore.getState().units.filter((unit) => roster[unit.species].size === 1);
  const picked = [];
  while (picked.length < CROWD_SIZE && candidates.length > 0) {
    picked.push(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]);
  }
  return picked.map((unit) => roster[unit.species]);
}

// Unité qui erre dans le couloir, puis sort quand `leaving` passe à vrai.
function Wanderer({
  species, entryDelay, leaving, onLeft,
}) {
  const { key, facing } = SPECIES_SPRITES[species.name];
  const [move, setMove] = useState(() => ({
    x: Math.random() < 0.5 ? OUTSIDE_LEFT : OUTSIDE_RIGHT, duration: 0, towardsLeft: true,
  }));
  const buttonRef = useRef(null);
  const spriteRef = useRef(null);
  const pause = useRef(null);
  const leavingRef = useRef(leaving);
  const entered = useRef(false);
  const entry = useRef({ timeout: null, frame: null });

  // `left` est le centre de l'unité.
  const moveTo = useCallback((target) => {
    const button = buttonRef.current;
    const from = (button.offsetLeft / button.parentElement.offsetWidth) * 100;
    setMove({ x: target, duration: (Math.abs(target - from) / SPEED) * 1000, towardsLeft: target < from });
  }, []);

  useEffect(() => {
    // Attend son tour, puis une frame pour que l'unité soit placée hors de l'écran.
    entry.current.timeout = setTimeout(() => {
      entry.current.frame = requestAnimationFrame(() => {
        entered.current = true;
        moveTo(randomBetween(5, 95));
      });
    }, entryDelay);
    return () => {
      clearTimeout(entry.current.timeout);
      cancelAnimationFrame(entry.current.frame);
      clearTimeout(pause.current);
    };
  }, [moveTo, entryDelay]);

  useEffect(() => {
    leavingRef.current = leaving;
    if (!leaving) return;
    clearTimeout(pause.current);
    if (!entered.current) {
      clearTimeout(entry.current.timeout);
      cancelAnimationFrame(entry.current.frame);
      onLeft();
      return;
    }
    const button = buttonRef.current;
    const onLeftHalf = button.offsetLeft < button.parentElement.offsetWidth / 2;
    moveTo(onLeftHalf ? OUTSIDE_LEFT : OUTSIDE_RIGHT);
  }, [leaving, moveTo, onLeft]);

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

// Unités qui errent en bas de l'accueil, renouvelées toutes les 5 minutes.
export default function HomeWanderer({ playerFaction }) {
  const roster = FACTIONS[playerFaction].roster;
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
    // Découpé sur les côtés seulement : le sursaut dépasse.
    <div className="pointer-events-none absolute -right-game -bottom-0.5 -left-game h-14.5 overflow-x-clip">
      {crowd.species.map((species, i) => (
        <Wanderer
          key={`${crowd.id}-${i}`}
          species={species}
          entryDelay={i * ENTRY_GAP_MS}
          leaving={leaving}
          onLeft={onLeft}
        />
      ))}
    </div>
  );
}
