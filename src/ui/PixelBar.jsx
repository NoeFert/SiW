import '@/components/ui/8bit/styles/pixel-ui.css';

// `ratio` : 0 à 1.
export default function PixelBar({ ratio, className = '' }) {
  return (
    <span className={`pixel-bar block ${className}`}>
      <span className="pixel-bar-fill" style={{ width: `calc((100% + 4px) * ${ratio})` }} />
      <span className="pixel-bar-frame" />
    </span>
  );
}
