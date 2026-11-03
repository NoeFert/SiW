import { Badge } from '@/components/ui/8bit/badge.jsx';
import PixelBar from './PixelBar.jsx';
import { TEXT } from './strings.js';

export function LevelBadge({ level, label = TEXT.levels.badge(level) }) {
  return <Badge variant="faction" className="text-[10px] mx-1.5">{label}</Badge>;
}

export function xpText(progress) {
  return progress.isMax ? TEXT.levels.max : TEXT.levels.xp(progress.xpInLevel, progress.xpForLevel);
}

export function XpBar({ progress, label = xpText(progress), className = '' }) {
  const ratio = progress.isMax ? 1 : progress.xpInLevel / progress.xpForLevel;
  return (
    <div className={`flex items-center gap-2 text-[10px] ${className}`}>
      <PixelBar ratio={ratio} className="flex-1 min-w-12" />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}
