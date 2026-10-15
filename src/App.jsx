import {
  Fragment, useCallback, useEffect, useState,
} from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
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

// technical.md 5.2 : l'écran de départ se déduit du profil sauvegardé, pas d'un routeur.
function initialScreen() {
  const { faction, tutoBattleWon } = useProfileStore.getState();
  if (!faction) return 'intro';
  if (!tutoBattleWon) return 'battle';
  startFountain();
  return 'home';
}

// technical.md 5.4 : navigation par état React simple dans le composant racine, pas de librairie
// de routing — un seul onglet, une session continue.
export default function App() {
  const [screen, setScreen] = useState(initialScreen);
  const [battleAttempt, setBattleAttempt] = useState(0); // change de clé = BattleScreen tout neuf
  // Bataille en cours : la bataille tutoriel, ou une de « Partir en guerre » (rules.md 11.7).
  const [battleId, setBattleId] = useState(TUTO_BATTLE_ID);
  const [victoryProgress, setVictoryProgress] = useState(null); // XP, niveaux et pertes de la victoire
  const [defeatLosses, setDefeatLosses] = useState(null); // pertes d'une défaite de guerre
  const [summonBack, setSummonBack] = useState('home'); // écran où ramène « Retour » de l'invocation
  // technical.md 5.5 : au moins une invocation depuis la dernière arrivée sur l'accueil (conseil
  // « recrue hors de l'armée » du tutoriel de l'accueil).
  const [summonedSinceHome, setSummonedSinceHome] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0); // menu devs : recharge l'écran après un profil
  const playerFaction = useProfileStore((profile) => profile.faction);
  const ownedUnits = useProfileStore((profile) => profile.units);
  const army = useProfileStore((profile) => profile.army);
  const isWarBattle = WAR_BATTLE_IDS.includes(battleId);

  // GRAPHICS.md « Palettes des factions » : couleurs, curseurs et accents de l'interface selon la
  // faction du joueur (src/ui/factionTheme.js) ; sans faction (intro, choix de faction) : thème
  // par défaut.
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

  // rules.md 11.7 : lance une bataille de « Partir en guerre » avec l'armée.
  const startWarBattle = useCallback((id) => {
    setBattleId(id);
    startBattle();
  }, [startBattle]);

  // technical.md 5.4 : dans la bataille tutoriel, pertes et XP ne sont comptées qu'à la victoire —
  // une tentative ratée ne change rien au profil.
  const handleVictory = useCallback((battle) => {
    setVictoryProgress(applyVictory(battleId, battle.units));
    setScreen('victory');
  }, [battleId]);

  // Menu devs, pendant la bataille tutoriel (rules.md 11) : comptée comme gagnée sans combat
  // (aucune perte, armée de départ avec toute la dotation, récompense et XP fixe du joueur), puis
  // retour direct à l'accueil.
  const skipTutoBattle = useCallback(() => {
    applyVictory(TUTO_BATTLE_ID, []);
    goHome();
  }, [goHome]);

  // rules.md 8.1 : un match nul n'est pas une victoire — même suite qu'une défaite (réessayer),
  // mais annoncé comme tel. rules.md 11.7 : dans « Partir en guerre », les individus tués sont
  // perdus quand même (défaite, abandon ou match nul).
  const handleDefeat = useCallback((outcome, battle) => {
    setDefeatLosses(isWarBattle ? applyWarDefeat(battle.units) : null);
    setScreen(outcome === 'draw' ? 'draw' : 'defeat');
  }, [isWarBattle]);

  // Repart comme au tout premier lancement (menu des paramètres de l'accueil, menu devs).
  const restartGame = useCallback(() => {
    resetProfile();
    setBattleId(TUTO_BATTLE_ID);
    setScreen('intro');
  }, []);

  // Menu devs : charge un joueur de test, puis remonte l'écran pour qu'il reparte de ce profil.
  const loadTestProfile = (profile) => {
    replaceProfile(profile);
    setSaveVersion((v) => v + 1);
    goHome();
  };

  // technical.md 5.2 : l'invocation s'ouvre depuis l'accueil ou depuis l'écran des unités
  // (`from`), où « Retour » ramène.
  const openSummon = (from) => {
    setSummonBack(from);
    setScreen('summon');
  };

  // rules.md 2 : bataille tutoriel = tous les individus possédés ; « Partir en guerre » = l'armée.
  const battleUnits = isWarBattle ? armyUnits(army, ownedUnits) : ownedUnits;

  let content;
  if (screen === 'intro') {
    content = (
      <IntroScreen onContinue={() => setScreen('factionChoice')} />
    );
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
      {/* GRAPHICS.md « Interface » : fond des écrans — noir pour l'intro, le choix de faction et
          la bataille (la marge autour de la tour et du terrain se fond avec eux), dégradé vertical
          #2a2c2f → #838796 pour les autres (l'accueil le couvre de son château). */}
      <div
        className={`h-full p-game ${['intro', 'factionChoice', 'battle'].includes(screen)
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
