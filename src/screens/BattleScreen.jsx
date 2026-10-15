import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import BattleSceneClass, { BATTLE_FRAME_EVENT } from '../scenes/BattleScene.js';
import { BATTLES } from '../data/battles/index.js';
import { createBattleFromDefinition } from '../logic/battles/battleSetup.js';
import CommandTower from '../ui/CommandTower.jsx';
import TutorialOverlay from '../ui/TutorialOverlay.jsx';
import { GAME_WIDTH, GAME_HEIGHT } from '../renderConstants.js';

// Délai entre la victoire et l'affichage de l'écran de victoire.
const VICTORY_SCREEN_DELAY_MS = 3000;

// Largeur de la tour de commandement : sa largeur de base (300 à 400 px, 24 %), élargie vers la
// droite de toute la place que le terrain ne peut pas occuper. Le terrain (Phaser FIT, ratio
// fixe) est limité par la hauteur sur un écran large : la bande vide qu'il laisserait à droite
// revient à la tour, sans jamais réduire le terrain. L'écran de bataille couvre toute la fenêtre
// (-inset-game) : 100vw × 100vh est sa taille.
const TOWER_WIDTH = `max(clamp(300px, 24%, 400px), calc(100vw - 100vh * ${GAME_WIDTH} / ${GAME_HEIGHT}))`;

// technical.md 5.1/5.4 : une bataille repart de zéro à chaque entrée dans cet écran. Cet écran
// crée la bataille (src/logic/battles/) et en est le propriétaire : il la donne à la Scene Phaser,
// qui la fait avancer et l'affiche sur le terrain, et à la tour de commandement et au tutoriel
// (React), qui l'affichent et y transmettent les actions du joueur. Les deux couches ne se
// touchent pas (technical.md 2.2) : la Scene signale seulement chaque frame jouée
// (BATTLE_FRAME_EVENT), et l'écran se redessine alors avec elle.
// Le Game Phaser est créé au montage et détruit au démontage, dans le conteneur DOM `containerRef`.
// L'ID "phaser-root" est conservé sur ce conteneur car DeploymentList.jsx repère le <canvas> par
// ce sélecteur pour convertir les coordonnées de glisser-déposer (voir renderConstants.js).
// `battleId` : bataille à jouer (src/data/battles/), avec son tutoriel s'il en a un.
// `playerUnits` : individus du joueur engagés dans la bataille (rules.md 2), lus au montage
// seulement : chaque tentative remonte l'écran (clé battleAttempt dans App.jsx).
export default function BattleScreen({
  playerFaction, battleId, playerUnits, onVictory, onDefeat,
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [battle] = useState(() => createBattleFromDefinition(BATTLES[battleId], playerFaction, playerUnits));
  const [, setFrame] = useState(0);
  // Les fonctions de fin de bataille les plus récentes, lues par l'écouteur de frames sans
  // recréer le Game quand App en change.
  const endHandlers = useRef({ onVictory, onDefeat });
  endHandlers.current = { onVictory, onDefeat };

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#101010',
      scene: [BattleSceneClass],
      scale: {
        mode: Phaser.Scale.FIT,
        // Collé à la tour : la zone de déploiement du joueur touche la liste d'unités.
        autoCenter: Phaser.Scale.CENTER_VERTICALLY,
      },
    });
    gameRef.current = game;
    game.scene.start('BattleScene', { battle, playerFaction, battleId });

    // À chaque frame jouée par la Scene : redessiner l'écran (tour, tutoriel), puis, une seule
    // fois, passer à l'écran de fin quand la bataille est terminée.
    let ended = false;
    let victoryTimeoutId;
    game.events.on(BATTLE_FRAME_EVENT, () => {
      setFrame((n) => n + 1);
      if (ended || battle.outcome === 'ongoing') return;
      ended = true;
      if (battle.outcome === 'playerVictory') {
        // Le terrain reste affiché quelques secondes avant l'écran de victoire ; App en tire
        // pertes et XP (technical.md 5.4).
        victoryTimeoutId = setTimeout(() => endHandlers.current.onVictory(battle), VICTORY_SCREEN_DELAY_MS);
      } else {
        // 'draw' : match nul (rules.md 8.1), annoncé comme tel ; la bataille sert aux pertes
        // d'une défaite de « Partir en guerre » (rules.md 11.7).
        endHandlers.current.onDefeat(battle.outcome, battle);
      }
    });

    return () => {
      clearTimeout(victoryTimeoutId);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [battle, playerFaction, battleId]);

  // Position affichée du sprite d'une unité (px du canevas), demandée à la Scene pour la main du
  // tutoriel : pendant une pause, un sprite peut rester figé à mi-chemin entre deux cases.
  const unitDisplayCenter = (unit) => gameRef.current?.scene.getScene('BattleScene')?.unitDisplayCenter(unit) ?? null;

  return (
    // ui-battle-screen-decisions.md 1 : tour de commandement à gauche, terrain à droite,
    // côte à côte (jamais superposés). `dark` : thème sombre des composants 8bitcn de la tour.
    // GRAPHICS.md « Interface » : la tour et le terrain vont jusqu'au bord de la fenêtre, padding
    // du jeu compris (-inset-game).
    <div className="relative h-full w-full">
      <div className="absolute -inset-game flex">
        <div className="dark flex-none h-full" style={{ width: TOWER_WIDTH }}>
          <CommandTower battle={battle} />
        </div>
        <div id="phaser-root" ref={containerRef} className="flex-1 min-w-0 h-full" />
        <TutorialOverlay battle={battle} unitDisplayCenter={unitDisplayCenter} />
      </div>
    </div>
  );
}
