import { Button } from '@/components/ui/8bit/button.jsx';
import { ReportList } from './VictoryScreen.jsx';
import { TEXT } from '../ui/strings.js';

// Sert aussi au match nul. `lost` : pertes d'une bataille de guerre.
export default function DefeatScreen({
  isDraw, onRetry, lost = null, onHome = null, canRetry = true,
}) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-3xl font-bold">{isDraw ? TEXT.defeat.draw : TEXT.defeat.title}</h1>
      {lost && (lost.length > 0
        ? <ReportList title={TEXT.report.lost} rows={lost} count={(row) => row.lost} lost />
        : <p className="retro text-xs">{TEXT.report.noLosses}</p>)}
      <div className="flex gap-6">
        <Button variant="destructive" disabled={!canRetry} onClick={onRetry}>{TEXT.defeat.retry}</Button>
        {onHome && <Button onClick={onHome}>{TEXT.defeat.home}</Button>}
      </div>
    </div>
  );
}
