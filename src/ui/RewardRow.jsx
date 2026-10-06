import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';
import { TEXT } from './strings.js';

// Une récompense : son icône, et la quantité gagnée en dessous.
function Reward({ icon, amount }) {
  return (
    <div className="pixel-panel retro flex min-w-20 flex-col items-center gap-2 px-3 text-xs">
      {icon}
      <span>{amount}</span>
    </div>
  );
}

// GRAPHICS.md « Partir en guerre » / technical.md 5.3 : rangée de récompenses — Spirit Stones,
// puis XP du joueur. Panneau d'une bataille de WarScreen et écran de victoire du jeu normal.
export default function RewardRow({ spiritStones, xp }) {
  return (
    <div className="flex gap-3">
      <Reward icon={<SpiritStoneIcon />} amount={spiritStones} />
      <Reward icon={<span className="leading-[22px]">{TEXT.war.xp}</span>} amount={xp} />
    </div>
  );
}
