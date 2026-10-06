import { useEffect } from 'react';
import { Flag, MoveRight, Swords } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/8bit/tooltip.jsx';
import { cn } from '@/lib/utils';
import { FLEE_COOLDOWN_SECONDS, getFleeCooldownRemaining } from '../logic/commands.js';
import {
  availableOrders, canChooseOrder, chooseOrder, cancelCommand,
} from '../logic/commandSelection.js';
import PauseButton from './PauseButton.jsx';
import { TEXT } from './strings.js';

// Icônes provisoires (ui-battle-screen-decisions.md 2.3).
const ORDER_ICONS = { move: MoveRight, attack: Swords, flee: Flag };

// Ordre en cours de sélection : fond de la couleur de la faction (classes littérales, Tailwind
// ne détecte pas les noms construits dynamiquement).
const SELECTED_CLASS = {
  wyrms: 'bg-faction-wyrms text-black hover:bg-faction-wyrms',
  undead: 'bg-faction-undead text-black hover:bg-faction-undead',
};

// rules.md 5 : rangée « Ordres » de la tour, entre la jauge et la liste des unités. Pause, puis
// un bouton par ordre : un clic choisit l'ordre (pause d'interaction), l'unité et la cible se
// choisissent sur le terrain (BattleScene -> clickField). Re-cliquer l'ordre surligné, faire un
// clic droit sur le terrain ou appuyer sur Échap annule. Seul Fuir a un cooldown, qui remplit
// son bouton de bas en haut.
export default function OrdersRow({ battle, playerFaction }) {
  const selectedOrder = battle.commandSelection?.order ?? null;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') cancelCommand(battle);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [battle]);

  const fleeRemaining = getFleeCooldownRemaining(battle.playerFleeState, battle.elapsedSeconds);

  return (
    <div>
      <h2 className="retro text-xs mb-3">{TEXT.ordersTitle}</h2>
      <div className="flex items-center gap-3">
        <PauseButton battle={battle} />
        {availableOrders(battle).map((order) => {
          const Icon = ORDER_ICONS[order];
          const selected = selectedOrder === order;
          const cooling = order === 'flee' && fleeRemaining > 0;
          const label = cooling ? TEXT.fleeCooldown(fleeRemaining) : TEXT.orders[order];
          // Pas d'attribut disabled : le tooltip (temps restant) doit rester visible au survol.
          const unavailable = !selected && !canChooseOrder(battle, order);
          // Enveloppe flex-col : TooltipContent (8bitcn) rend toujours une <div> vide, qui sinon
          // ajouterait un écart dans la rangée.
          return (
            <div key={order} className="flex flex-col">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    data-tutorial={`order-${order}`}
                    size="icon"
                    onClick={() => chooseOrder(battle, order)}
                    aria-disabled={unavailable}
                    aria-label={label}
                    aria-pressed={selected}
                    className={cn(
                      'relative overflow-hidden',
                      selected && SELECTED_CLASS[playerFaction],
                      unavailable && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {cooling && (
                      <span
                        className="absolute inset-x-0 bottom-0 bg-foreground/30"
                        style={{ height: `${(1 - fleeRemaining / FLEE_COOLDOWN_SECONDS) * 100}%` }}
                      />
                    )}
                    <Icon className="relative" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" font="normal">{label}</TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
