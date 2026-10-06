import '@/components/ui/8bit/styles/pixel-ui.css';
import { TEXT } from './strings.js';

// GRAPHICS.md « Spirit Stones » : gemme noire fixe (Black/Jewel_Spin du pack Pixel UI & HUD), à
// côté de chaque solde et prix en Spirit Stones.
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

// rules.md 11.3 : solde de Spirit Stones, en haut à droite (HomeScreen et SummonScreen, qui le
// placent) : l'icône et le nombre seuls, dans un cadre (Panels/Black/Panel du pack).
export default function SpiritStonesBalance({ amount }) {
  return (
    <span className="pixel-panel retro inline-flex items-center gap-2 px-2 text-sm">
      <span data-spirit-balance-icon className="flex"><SpiritStoneIcon /></span>
      {amount}
    </span>
  );
}
