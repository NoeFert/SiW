import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { surrenderPlayer, startSurrenderConfirm, endSurrenderConfirm } from '../logic/battles/playerActions.js';
import { TEXT } from './strings.js';

// Abandon (rules.md 8.2).
// TODO(design) : emplacement provisoire.
export default function SurrenderButton({ battle }) {
  return (
    <AlertDialog onOpenChange={(open) => (open ? startSurrenderConfirm(battle) : endSurrenderConfirm(battle))}>
      <AlertDialogTrigger>
        <button
          type="button"
          disabled={battle.outcome !== 'ongoing'}
          className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-red-400"
        >
          {TEXT.surrender}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{TEXT.surrenderTitle}</AlertDialogTitle>
          <AlertDialogDescription>{TEXT.surrenderDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{TEXT.surrenderCancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => surrenderPlayer(battle)}>{TEXT.surrender}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
