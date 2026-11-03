import { useCallback, useEffect, useState } from 'react';
import { FACTIONS } from '../data/factions/index.js';
import { spritePath } from '../data/sprites.js';
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

function MenuItem({ onClick, tutorial, children }) {
  return (
    <button type="button" onClick={onClick} data-tutorial={tutorial} className="pixel-menu-item retro text-sm">
      {children}
    </button>
  );
}

// Provisoire.
const HOME_BACKGROUNDS = {
  wyrms: 'backgrounds/dark-castle-warm-grey.png',
  undead: 'backgrounds/dark-castle-cold-grey.png',
};

const rectCenter = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

// Écran d'accueil (technical.md 5.1).
export default function HomeScreen({
  playerFaction, onOpenWar, onOpenUnits, onOpenArmy, onOpenSummon, onOpenCodex, onResetGame, justSummoned, onArrived,
}) {
  const spiritStones = useProfileStore((profile) => profile.spiritStones);
  const unitCount = useProfileStore((profile) => profile.units.length);
  const playerXp = useProfileStore((profile) => profile.playerXp);
  const progress = playerProgress(playerXp);

  // Au plus un conseil par arrivée (technical.md 5.5).
  const [tip, setTip] = useState(() => {
    const profile = useProfileStore.getState();
    return homeTipToShow({
      seen: profile.homeTipsSeen,
      justSummoned,
      units: profile.units,
      army: profile.army,
      roster: FACTIONS[playerFaction].roster,
      startingArmy: FACTIONS[playerFaction].startingArmy,
      spiritStones: profile.spiritStones,
    });
  });
  useEffect(() => {
    if (tip) markHomeTipSeen(tip);
    onArrived();
  }, []);

  // Le solde affiché n'augmente qu'à l'arrivée des gemmes en vol.
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
          <img src={spritePath(FACTIONS[playerFaction].sovereignSprite)} alt="" className="size-full object-contain" />
        </div>
        <div className="flex w-64 flex-col gap-2">
          <span className="retro text-xs">{TEXT.sovereignName[playerFaction]}</span>
          <XpBar
            progress={progress}
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
