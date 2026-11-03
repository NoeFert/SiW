import {
  Fragment, useCallback, useEffect, useState,
} from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
import PrologueScreen from './screens/PrologueScreen.jsx';
import FactionChoiceScreen from './screens/FactionChoiceScreen.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import DefeatScreen from './screens/DefeatScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import UnitsScreen from './screens/UnitsScreen.jsx';
import ArmyScreen from './screens/ArmyScreen.jsx';
import SummonScreen from './screens/SummonScreen.jsx';
import WarScreen from './screens/WarScreen.jsx';
import CodexScreen from './screens/CodexScreen.jsx';
import DevMenu from './dev/DevMenu.jsx';
import { TUTO_BATTLE_ID, WAR_BATTLE_IDS } from './data/battles/index.js';
import { armyUnits } from './logic/army.js';
import {
  useProfileStore, chooseFaction, applyVictory, applyWarDefeat, startFountain, resetProfile,
  replaceProfile,
} from './state/profileStore.js';
import { applyFactionTheme } from './ui/factionTheme.js';

// L'écran de départ se déduit du profil sauvegardé.
function initialScreen() {
  const { faction, tutoBattleWon } = useProfileStore.getState();
  if (!faction) return 'intro';
  if (!tutoBattleWon) return 'battle';
  startFountain();
  return 'home';
}

// Navigation par état React, sans routeur (technical.md 5.4).
export default function App() {
  const [screen, setScreen] = useState(initialScreen);
  const [battleAttempt, setBattleAttempt] = useState(0); // nouvelle clé = BattleScreen tout neuf
  const [battleId, setBattleId] = useState(TUTO_BATTLE_ID);
  const [victoryProgress, setVictoryProgress] = useState(null);
  const [defeatLosses, setDefeatLosses] = useState(null);
  const [summonBack, setSummonBack] = useState('home'); // écran où ramène « Retour »
  const [summonedSinceHome, setSummonedSinceHome] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0); // menu devs : recharge l'écran
  const playerFaction = useProfileStore((profile) => profile.faction);
  const ownedUnits = useProfileStore((profile) => profile.units);
  const army = useProfileStore((profile) => profile.army);
  const isWarBattle = WAR_BATTLE_IDS.includes(battleId);

  // Thème de l'interface selon la faction du joueur.
  useEffect(() => {
    applyFactionTheme(playerFaction);
  }, [playerFaction]);

  const startBattle = useCallback(() => {
    setBattleAttempt((n) => n + 1);
    setScreen('battle');
  }, []);

  const goHome = useCallback(() => {
    startFountain();
    setScreen('home');
  }, []);

  const startTutoBattle = useCallback((faction) => {
    chooseFaction(faction);
    setBattleId(TUTO_BATTLE_ID);
    startBattle();
  }, [startBattle]);

  const startWarBattle = useCallback((id) => {
    setBattleId(id);
    startBattle();
  }, [startBattle]);

  // Bataille tutoriel : une tentative ratée ne change rien au profil.
  const handleVictory = useCallback((battle) => {
    setVictoryProgress(applyVictory(battleId, battle.units));
    setScreen('victory');
  }, [battleId]);

  // Menu devs : bataille tutoriel comptée comme gagnée, sans perte.
  const skipTutoBattle = useCallback(() => {
    applyVictory(TUTO_BATTLE_ID, []);
    goHome();
  }, [goHome]);

  // Match nul : même suite qu'une défaite (rules.md 8.1).
  const handleDefeat = useCallback((outcome, battle) => {
    setDefeatLosses(isWarBattle ? applyWarDefeat(battle.units) : null);
    setScreen(outcome === 'draw' ? 'draw' : 'defeat');
  }, [isWarBattle]);

  const restartGame = useCallback(() => {
    resetProfile();
    setBattleId(TUTO_BATTLE_ID);
    setScreen('intro');
  }, []);

  const loadTestProfile = (profile) => {
    replaceProfile(profile);
    setSaveVersion((v) => v + 1);
    goHome();
  };

  const openSummon = (from) => {
    setSummonBack(from);
    setScreen('summon');
  };

  // Bataille tutoriel : tous les individus ; guerre : l'armée.
  const battleUnits = isWarBattle ? armyUnits(army, ownedUnits) : ownedUnits;

  let content;
  if (screen === 'intro') {
    content = (
      <IntroScreen onContinue={() => setScreen('prologue')} />
    );
  } else if (screen === 'prologue') {
    content = <PrologueScreen onContinue={() => setScreen('factionChoice')} />;
  } else if (screen === 'factionChoice') {
    content = <FactionChoiceScreen onChoose={startTutoBattle} />;
  } else if (screen === 'battle') {
    content = (
      <BattleScreen
        key={battleAttempt}
        playerFaction={playerFaction}
        battleId={battleId}
        playerUnits={battleUnits}
        onVictory={handleVictory}
        onDefeat={handleDefeat}
      />
    );
  } else if (screen === 'victory') {
    content = (
      <VictoryScreen
        onContinue={goHome}
        progress={victoryProgress}
        playerFaction={playerFaction}
      />
    );
  } else if (screen === 'defeat' || screen === 'draw') {
    content = (
      <DefeatScreen
        isDraw={screen === 'draw'}
        onRetry={startBattle}
        lost={defeatLosses}
        onHome={isWarBattle ? goHome : null}
        canRetry={battleUnits.length > 0}
      />
    );
  } else if (screen === 'war') {
    content = <WarScreen playerFaction={playerFaction} onFight={startWarBattle} onBack={goHome} />;
  } else if (screen === 'units') {
    content = (
      <UnitsScreen
        playerFaction={playerFaction}
        onBack={goHome}
        onOpenSummon={() => openSummon('units')}
      />
    );
  } else if (screen === 'army') {
    content = <ArmyScreen playerFaction={playerFaction} onBack={goHome} />;
  } else if (screen === 'codex') {
    content = <CodexScreen onBack={goHome} />;
  } else if (screen === 'summon') {
    content = (
      <SummonScreen
        playerFaction={playerFaction}
        onSummoned={() => setSummonedSinceHome(true)}
        onBack={() => (summonBack === 'units' ? setScreen('units') : goHome())}
      />
    );
  } else {
    content = (
      <HomeScreen
        playerFaction={playerFaction}
        onOpenWar={() => setScreen('war')}
        onOpenUnits={() => setScreen('units')}
        onOpenArmy={() => setScreen('army')}
        onOpenSummon={() => openSummon('home')}
        onOpenCodex={() => setScreen('codex')}
        onResetGame={restartGame}
        justSummoned={summonedSinceHome}
        onArrived={() => setSummonedSinceHome(false)}
      />
    );
  }

  return (
    <>
      {/* Fond des écrans */}
      <div
        className={`h-full p-game ${['intro', 'prologue', 'factionChoice', 'battle'].includes(screen)
          ? 'bg-neutral-900'
          : 'bg-linear-to-b from-[#2a2c2f] to-[#838796]'}`}
      >
        <Fragment key={saveVersion}>{content}</Fragment>
      </div>
      {import.meta.env.DEV && (
        <DevMenu
          onRestart={restartGame}
          onSkipTutoBattle={screen === 'battle' && battleId === TUTO_BATTLE_ID ? skipTutoBattle : null}
          onLoadProfile={loadTestProfile}
        />
      )}
    </>
  );
}
