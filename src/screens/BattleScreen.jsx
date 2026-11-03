import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import BattleSceneClass, { BATTLE_FRAME_EVENT } from '../scenes/BattleScene.js';
import { BATTLES } from '../data/battles/index.js';
import { createBattleFromDefinition } from '../logic/battles/battleSetup.js';
import CommandTower from '../ui/CommandTower.jsx';
import TutorialOverlay from '../ui/TutorialOverlay.jsx';
import { GAME_WIDTH, GAME_HEIGHT } from '../renderConstants.js';

const VICTORY_SCREEN_DELAY_MS = 3000;

// La tour récupère la place que le terrain (ratio fixe) laisse à droite.
const TOWER_WIDTH = `max(clamp(300px, 24%, 400px), calc(100vw - 100vh * ${GAME_WIDTH} / ${GAME_HEIGHT}))`;

// Crée la bataille et la partage entre la Scene Phaser et la tour React.
// Chaque tentative remonte l'écran (clé battleAttempt dans App.jsx).
export default function BattleScreen({
  playerFaction, battleId, playerUnits, onVictory, onDefeat,
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [battle] = useState(() => createBattleFromDefinition(BATTLES[battleId], playerFaction, playerUnits));
  const [, setFrame] = useState(0);
  // Lu par l'écouteur de frames sans recréer le Game.
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
        autoCenter: Phaser.Scale.CENTER_VERTICALLY,
      },
    });
    gameRef.current = game;
    game.scene.start('BattleScene', { battle, playerFaction, battleId });

    let ended = false;
    let victoryTimeoutId;
    game.events.on(BATTLE_FRAME_EVENT, () => {
      setFrame((n) => n + 1);
      if (ended || battle.outcome === 'ongoing') return;
      ended = true;
      if (battle.outcome === 'playerVictory') {
        victoryTimeoutId = setTimeout(() => endHandlers.current.onVictory(battle), VICTORY_SCREEN_DELAY_MS);
      } else {
        endHandlers.current.onDefeat(battle.outcome, battle);
      }
    });

    return () => {
      clearTimeout(victoryTimeoutId);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [battle, playerFaction, battleId]);

  const unitDisplayCenter = (unit) => gameRef.current?.scene.getScene('BattleScene')?.unitDisplayCenter(unit) ?? null;

  return (
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
