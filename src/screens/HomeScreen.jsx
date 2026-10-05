import { useCallback, useRef, useState } from 'react';
import { SOVEREIGN_SPRITES, spritePath } from '../data/sprites.js';
import { playerProgress } from '../logic/levels.js';
import {
  getOwnedUnits, getPlayerXp, getSpiritStones, saveSpiritStones,
} from '../persistence.js';
import HomeWanderer from '../ui/HomeWanderer.jsx';
import { XpBar } from '../ui/LevelDisplay.jsx';
import SpiritFountain from '../ui/SpiritFountain.jsx';
import SpiritStonesFlight from '../ui/SpiritStonesFlight.jsx';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

// GRAPHICS.md « Interface » : entrée de menu sans cadre de bouton, soulignée du séparateur
// (violet, doré pour les Wyrms).
function MenuItem({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="pixel-menu-item retro flex flex-col items-end gap-2 text-sm">
      {children}
      <span aria-hidden className="pixel-divider w-full" />
    </button>
  );
}

// GRAPHICS.md « Accueil » : château sombre en fond, gris chaud pour les Wyrms, gris froid pour les
// Morts-Vivants (provisoire).
const HOME_BACKGROUNDS = {
  wyrms: 'backgrounds/dark-castle-warm-grey.png',
  undead: 'backgrounds/dark-castle-cold-grey.png',
};

const rectCenter = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

// technical.md 5.1 : écran d'accueil, point central du jeu, accessible uniquement après la
// première victoire. En haut à gauche, le portrait du souverain avec, à sa droite, son nom, sa
// barre d'XP et son niveau (rules.md 11.5) ; solde de Spirit Stones en haut à droite (rules.md
// 11.3) ; menu de quatre entrées alignées à droite — « Partir en guerre » (WarScreen), les unités
// (entrée au nom de la faction) et « Armées » (CivilizationScreen), invocation — et la Spirit
// Fountain alignée à gauche (rules.md 11.8).
export default function HomeScreen({
  playerFaction, onOpenWar, onOpenUnits, onOpenArmy, onOpenSummon,
}) {
  const [spiritStones, setSpiritStones] = useState(getSpiritStones);
  const progress = playerProgress(getPlayerXp());

  // rules.md 11.8 : la récolte est sauvegardée tout de suite ; le solde affiché n'augmente qu'à
  // l'arrivée des gemmes qui volent de la fontaine jusqu'à lui (au plus 5), pour montrer où
  // elles vont. `landedBalance` : solde à afficher à l'arrivée.
  const [flight, setFlight] = useState(null);
  const landedBalance = useRef(null);
  const collect = (amount, iconRect) => {
    const balance = getSpiritStones() + amount;
    saveSpiritStones(balance);
    landedBalance.current = balance;
    const target = document.querySelector('[data-spirit-balance-icon]')?.getBoundingClientRect();
    if (!iconRect || !target) {
      setSpiritStones(balance);
      return;
    }
    setFlight({
      key: Date.now(), from: rectCenter(iconRect), to: rectCenter(target), count: Math.min(amount, 5),
    });
  };
  const land = useCallback(() => {
    setSpiritStones(landedBalance.current);
    setFlight(null);
  }, []);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-10 text-white">
      {/* Fond jusqu'au bord de la fenêtre, padding de 30 px compris (-inset-7.5), sans lissage. */}
      <div
        className="pixelated absolute -inset-7.5 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS[playerFaction]})` }}
      />
      <SpiritStonesBalance amount={spiritStones} framed />
      <div className="absolute top-0 left-0 flex items-center gap-4">
        <div className="pixel-frame size-24">
          <img src={spritePath(SOVEREIGN_SPRITES[playerFaction])} alt="" className="size-full object-contain" />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <span className="retro text-xs">{TEXT.sovereignName[playerFaction]}</span>
          <XpBar
            progress={progress}
            faction={playerFaction}
            label={TEXT.levels.player(progress.level)}
            className="retro"
          />
        </div>
      </div>
      <nav className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-end gap-8">
        <MenuItem onClick={onOpenWar}>{TEXT.home.goToWar}</MenuItem>
        <MenuItem onClick={onOpenUnits}>
          {TEXT.home.units(TEXT.factions[playerFaction], (getOwnedUnits() ?? []).length)}
        </MenuItem>
        <MenuItem onClick={onOpenArmy}>{TEXT.home.army}</MenuItem>
        <MenuItem onClick={onOpenSummon}>{TEXT.home.summon}</MenuItem>
      </nav>
      <HomeWanderer playerFaction={playerFaction} />
      {/* Fontaine posée sur le sol du château du fond : son bas à 40 px du bas de la fenêtre (le
          padding du jeu en fait déjà 30). */}
      <div className="absolute left-2 -bottom-0.5">
        <SpiritFountain playerLevel={progress.level} onHarvest={collect} />
      </div>
      {flight && (
        <SpiritStonesFlight key={flight.key} from={flight.from} to={flight.to} count={flight.count} onDone={land} />
      )}
    </div>
  );
}
