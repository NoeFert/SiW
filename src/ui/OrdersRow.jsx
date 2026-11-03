import { useEffect } from 'react';
import { Flag, MoveRight, Swords } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/8bit/tooltip.jsx';
import { cn } from '@/lib/utils';
import { FLEE_COOLDOWN_SECONDS, getFleeCooldownRemaining } from '../logic/battles/fleeCooldown.js';
import {
  ORDERS, canChooseOrder, chooseOrder, cancelOrder,
} from '../logic/battles/orderSelection.js';
import PauseButton from './PauseButton.jsx';
import { TEXT } from './strings.js';

// Icônes provisoires.
const ORDER_ICONS = { move: MoveRight, attack: Swords, flee: Flag };

const SELECTED_CLASS = 'bg-faction text-black hover:bg-faction';

// Rangée « Ordres » de la tour (rules.md 5).
export default function OrdersRow({ battle }) {
  const selectedOrder = battle.orderSelection?.order ?? null;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') cancelOrder(battle);
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
        {ORDERS.map((order) => {
          const Icon = ORDER_ICONS[order];
          const selected = selectedOrder === order;
          const cooling = order === 'flee' && fleeRemaining > 0;
          const label = cooling ? TEXT.fleeCooldown(fleeRemaining) : TEXT.orders[order];
          // Pas de disabled : le tooltip doit rester visible au survol.
          const unavailable = !selected && !canChooseOrder(battle, order);
          // flex-col : TooltipContent rend une <div> vide.
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
                      selected && SELECTED_CLASS,
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
