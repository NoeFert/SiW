import { Badge } from '@/components/ui/8bit/badge.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import { TEXT } from '../ui/strings.js';

// Codex des mots-clés, ouvert depuis le menu des paramètres de l'accueil : chaque tag affiché sur
// les unités (type d'attaque puis keywords, voir keywordLabels) avec son effet en quelques mots.
export default function CodexScreen({ onBack }) {
  return (
    <ScreenLayout title={TEXT.settings.codex} onBack={onBack}>
      <dl className="flex max-w-3xl flex-col gap-6">
        {Object.entries(TEXT.keywords).map(([keyword, label]) => (
          <div key={keyword} className="flex flex-col items-start gap-2">
            <dt>
              <Badge variant="secondary" font="normal" className="text-[10px] mx-1.5">{label}</Badge>
            </dt>
            <dd className="text-sm">{TEXT.keywordEffects[keyword]}</dd>
          </div>
        ))}
      </dl>
    </ScreenLayout>
  );
}
