import '@/components/ui/8bit/styles/pixel-ui.css';

// GRAPHICS.md « Interface » : barre de valeur du pack Pixel UI & HUD (RegularBarA), remplie à
// `ratio` (0 à 1), dans la couleur de la faction du joueur (violette sans faction).
export default function PixelBar({ ratio, className = '' }) {
  return (
    <span className={`pixel-bar block ${className}`}>
      <span className="pixel-bar-fill" style={{ width: `calc((100% + 4px) * ${ratio})` }} />
      <span className="pixel-bar-frame" />
    </span>
  );
}
