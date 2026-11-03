import { TooltipProvider } from '@/components/ui/8bit/tooltip.jsx';
import { getPresenceUsed } from '../logic/battles/deployment.js';
import SurrenderButton from './SurrenderButton.jsx';
import PresenceGauge from './PresenceGauge.jsx';
import OrdersRow from './OrdersRow.jsx';
import DeploymentList from './DeploymentList.jsx';
import { TEXT } from './strings.js';

// Tour de commandement, à gauche du terrain.
export default function CommandTower({ battle }) {
  const unitsOnField = battle.units.filter((u) => u.isOnField);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-neutral-950 text-foreground">
        <div className="relative flex-none pl-game pr-4 pt-game pb-2">
          <div className="absolute top-game right-4">
            <SurrenderButton battle={battle} />
          </div>
          <div className="pt-8">
            <PresenceGauge used={getPresenceUsed('player', unitsOnField)} />
          </div>
          <div className="mt-4">
            <OrdersRow battle={battle} />
          </div>
          <h2 className="retro text-xs mt-4">{TEXT.yourUnits}</h2>
        </div>

        <div className="pixel-scrollbar flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] pl-game pr-0.5 pt-2 pb-game">
          <DeploymentList battle={battle} unitsOnField={unitsOnField} />
        </div>
      </div>
    </TooltipProvider>
  );
}
