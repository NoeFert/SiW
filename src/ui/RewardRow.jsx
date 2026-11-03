import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';
import { TEXT } from './strings.js';

function Reward({ icon, amount }) {
  return (
    <div className="pixel-panel retro flex min-w-20 flex-col items-center gap-2 px-3 text-xs">
      {icon}
      <span>{amount}</span>
    </div>
  );
}

export default function RewardRow({ spiritStones, xp }) {
  return (
    <div className="flex gap-3">
      <Reward icon={<SpiritStoneIcon />} amount={spiritStones} />
      <Reward icon={<span className="leading-[22px]">{TEXT.war.xp}</span>} amount={xp} />
    </div>
  );
}
