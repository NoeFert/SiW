import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { TEXT } from './strings.js';

// technical.md 5.1 : menu des paramètres de l'accueil, ouvert par l'icône d'engrenage à côté du
// solde de Spirit Stones. Une seule entrée : réinitialiser le jeu (technical.md 5.4), après
// confirmation.
export default function SettingsMenu({ onReset }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={TEXT.settings.title}
        aria-expanded={open}
        className="flex cursor-pointer"
      >
        <img src="/ui/settings.png" alt="" draggable={false} className="size-8" />
      </button>
      {open && (
        <>
          {/* Un clic n'importe où ailleurs referme le menu. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="pixel-panel absolute right-0 top-full z-50 mt-2 flex flex-col p-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
              className="pixel-menu-item retro whitespace-nowrap text-xs"
            >
              {TEXT.settings.resetGame}
            </button>
          </div>
        </>
      )}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{TEXT.settings.resetTitle}</AlertDialogTitle>
            <AlertDialogDescription>{TEXT.settings.resetDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{TEXT.settings.resetCancel}</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>{TEXT.settings.resetConfirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
