import { TooltipProvider } from '@/components/ui/8bit/tooltip.jsx';
import { getPresenceUsed } from '../logic/battles/deployment.js';
import { useBattle } from './useBattle.js';
import SurrenderButton from './SurrenderButton.jsx';
import PresenceGauge from './PresenceGauge.jsx';
import OrdersRow from './OrdersRow.jsx';
import DeploymentList from './DeploymentList.jsx';
import { TEXT } from './strings.js';

// ui-battle-screen-decisions.md 1-2 : tour de commandement, à gauche du terrain. De haut en
// bas : Abandonner (coin haut-droit), jauge de présence, rangée « Ordres » (Pause et ordres),
// "Vos unités", liste (seule zone qui défile). GRAPHICS.md « Interface » : la tour va jusqu'au
// bord de la fenêtre, son contenu reste à la distance du padding du jeu (game, 48 px) en haut, à
// gauche et en bas. À droite (côté terrain) : 16 px ; dans la liste, la scrollbar (14 px,
// gouttière toujours réservée) + 2 px.
export default function CommandTower({ playerFaction }) {
  const battle = useBattle();
  if (!battle) return null;

  const unitsOnField = battle.units.filter((u) => u.isOnField);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-neutral-950 text-foreground">
        <div className="relative flex-none pl-game pr-4 pt-game pb-2">
          <div className="absolute top-game right-4">
            <SurrenderButton battle={battle} />
          </div>
          <div className="pt-8">
            <PresenceGauge used={getPresenceUsed('player', unitsOnField)} playerFaction={playerFaction} />
          </div>
          <div className="mt-4">
            <OrdersRow battle={battle} playerFaction={playerFaction} />
          </div>
          <h2 className="retro text-xs mt-4">{TEXT.yourUnits}</h2>
        </div>

        <div className="pixel-scrollbar flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] pl-game pr-0.5 pt-2 pb-game">
          <DeploymentList battle={battle} unitsOnField={unitsOnField} playerFaction={playerFaction} />
        </div>
      </div>
    </TooltipProvider>
  );
}
