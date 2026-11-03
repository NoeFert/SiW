import '@/components/ui/8bit/styles/pixel-ui.css';
import { TEXT } from './strings.js';

export function SpiritStoneIcon() {
  return <span aria-hidden className="spirit-stone-icon" />;
}

export function SpiritStonesAmount({ amount, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SpiritStoneIcon />
      {TEXT.spiritStones(amount)}
    </span>
  );
}

export default function SpiritStonesBalance({ amount }) {
  return (
    <span className="pixel-panel retro inline-flex items-center gap-2 px-2 text-sm">
      <span data-spirit-balance-icon className="flex"><SpiritStoneIcon /></span>
      {amount}
    </span>
  );
}
