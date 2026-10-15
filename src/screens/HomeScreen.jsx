import { useCallback, useEffect, useState } from 'react';
import { ROSTERS } from '../data/rosters.js';
import { SOVEREIGN_SPRITES, spritePath } from '../data/sprites.js';
import { homeTipToShow } from '../logic/homeTips.js';
import { playerProgress } from '../logic/levels.js';
import { useProfileStore, markHomeTipSeen } from '../state/profileStore.js';
import HomeTip from '../ui/HomeTip.jsx';
import HomeWanderer from '../ui/HomeWanderer.jsx';
import { XpBar } from '../ui/LevelDisplay.jsx';
import SpiritFountain from '../ui/SpiritFountain.jsx';
import SpiritStonesFlight from '../ui/SpiritStonesFlight.jsx';
import SpiritStonesBalance from '../ui/SpiritStonesBalance.jsx';
import SettingsMenu from '../ui/SettingsMenu.jsx';
import { TEXT } from '../ui/strings.js';

// GRAPHICS.md « Interface » : entrée de menu sans cadre de bouton.
function MenuItem({ onClick, tutorial, children }) {
  return (
    <button type="button" onClick={onClick} data-tutorial={tutorial} className="pixel-menu-item retro text-sm">
      {children}
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
// 11.3), et à sa droite l'engrenage du menu des paramètres (codex des mots-clés, réinitialiser le jeu) ; menu de quatre entrées alignées à gauche — « Partir en guerre » (WarScreen), les unités
// (entrée au nom de la faction) et « Armées » (CivilizationScreen), invocation — et la Spirit
// Fountain alignée à gauche (rules.md 11.8).
export default function HomeScreen({
  playerFaction, onOpenWar, onOpenUnits, onOpenArmy, onOpenSummon, onOpenCodex, onResetGame, justSummoned, onArrived,
}) {
  const spiritStones = useProfileStore((profile) => profile.spiritStones);
  const unitCount = useProfileStore((profile) => profile.units.length);
  const playerXp = useProfileStore((profile) => profile.playerXp);
  const progress = playerProgress(playerXp);

  // technical.md 5.5 : au plus un conseil par arrivée, choisi à l'arrivée et marqué vu dès qu'il
  // s'affiche. `justSummoned` : au moins une invocation depuis l'arrivée précédente (remis à
  // zéro par `onArrived`).
  const [tip, setTip] = useState(() => {
    const profile = useProfileStore.getState();
    return homeTipToShow({
      seen: profile.homeTipsSeen,
      justSummoned,
      units: profile.units,
      army: profile.army,
      roster: ROSTERS[playerFaction],
      spiritStones: profile.spiritStones,
    });
  });
  useEffect(() => {
    if (tip) markHomeTipSeen(tip);
    onArrived();
  }, []); // une seule fois, à l'arrivée

  // rules.md 11.8 : la récolte est ajoutée au solde tout de suite (SpiritFountain) ; le solde
  // affiché n'augmente qu'à l'arrivée des gemmes qui volent de la fontaine jusqu'à lui (au plus
  // 5), pour montrer où elles vont. `flight.amount` : gemmes encore en vol, pas encore affichées.
  const [flight, setFlight] = useState(null);
  const collect = (amount, iconRect) => {
    const target = document.querySelector('[data-spirit-balance-icon]')?.getBoundingClientRect();
    if (!iconRect || !target) return;
    setFlight({
      key: Date.now(), from: rectCenter(iconRect), to: rectCenter(target), count: Math.min(amount, 5), amount,
    });
  };
  const land = useCallback(() => setFlight(null), []);
  const shownSpiritStones = spiritStones - (flight?.amount ?? 0);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-10 text-white">
      {/* Fond jusqu'au bord de la fenêtre, padding du jeu compris (-inset-game), sans lissage. */}
      <div
        className="pixelated absolute -inset-game bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS[playerFaction]})` }}
      />
      <div className="absolute top-0 right-0 z-10 flex items-center gap-4">
        <SpiritStonesBalance amount={shownSpiritStones} />
        <SettingsMenu onOpenCodex={onOpenCodex} onReset={onResetGame} />
      </div>
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
      <nav className="absolute left-5 top-1/2 -mt-8 flex -translate-y-1/2 flex-col items-start gap-8">
        <MenuItem onClick={onOpenWar} tutorial="home-war">{TEXT.home.goToWar}</MenuItem>
        <MenuItem onClick={onOpenUnits}>
          {TEXT.home.units(TEXT.factions[playerFaction], unitCount)}
        </MenuItem>
        <MenuItem onClick={onOpenArmy} tutorial="home-army">{TEXT.home.army}</MenuItem>
        <MenuItem onClick={onOpenSummon} tutorial="home-summon">{TEXT.home.summon}</MenuItem>
      </nav>
      <HomeWanderer playerFaction={playerFaction} />
      {/* Fontaine posée sur le sol du château du fond, dans le padding du jeu comme le reste du
          contenu. */}
      <div className="absolute left-2 -bottom-0.5">
        <SpiritFountain playerLevel={progress.level} onHarvest={collect} />
      </div>
      {tip && <HomeTip tip={tip} onClose={() => setTip(null)} />}
      {flight && (
        <SpiritStonesFlight key={flight.key} from={flight.from} to={flight.to} count={flight.count} onDone={land} />
      )}
    </div>
  );
}
