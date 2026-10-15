import {
  Fragment, useCallback, useEffect, useState,
} from 'react';
import IntroScreen from './screens/IntroScreen.jsx';
import FactionChoiceScreen from './screens/FactionChoiceScreen.jsx';
import BattleScreen from './screens/BattleScreen.jsx';
import VictoryScreen from './screens/VictoryScreen.jsx';
import DefeatScreen from './screens/DefeatScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import CivilizationScreen from './screens/CivilizationScreen.jsx';
import SummonScreen from './screens/SummonScreen.jsx';
import WarScreen from './screens/WarScreen.jsx';
import CodexScreen from './screens/CodexScreen.jsx';
import DevMenu from './dev/DevMenu.jsx';
import { TEST_PROFILES } from './dev/testProfiles.js';
import { FIRST_BATTLE_ID, WAR_BATTLE_IDS } from './data/battles.js';
import { armyUnits } from './logic/army.js';
import {
  useProfileStore, chooseFaction, applyVictory, applyWarDefeat, startFountain, resetProfile,
  replaceProfile,
} from './state/profileStore.js';

// technical.md 5.2 : l'écran de départ se déduit du profil sauvegardé, pas d'un routeur.
function initialScreen() {
  const { faction, firstBattleWon } = useProfileStore.getState();
  if (!faction) return 'intro';
  if (!firstBattleWon) return 'battle';
  startFountain();
  return 'home';
}

// technical.md 5.4 : navigation par état React simple dans le composant racine, pas de librairie
// de routing — un seul onglet, une session continue.
export default function App() {
  const [screen, setScreen] = useState(initialScreen);
  const [battleAttempt, setBattleAttempt] = useState(0); // change de clé = BattleScreen tout neuf
  // Bataille du jeu normal en cours : la bataille 01, ou une de « Partir en guerre » (rules.md 11.7).
  const [battleId, setBattleId] = useState(FIRST_BATTLE_ID);
  const [victoryProgress, setVictoryProgress] = useState(null); // XP, niveaux et pertes de la victoire
  const [defeatLosses, setDefeatLosses] = useState(null); // pertes d'une défaite de guerre
  // technical.md 5.2 : SummonScreen s'ouvre depuis l'accueil ou depuis l'écran des unités ;
  // « Retour » ramène à l'écran d'origine ('home' ou 'units').
  const [summonBack, setSummonBack] = useState('home');
  // technical.md 5.5 : au moins une invocation depuis la dernière arrivée sur l'accueil (conseil
  // « recrue hors de l'armée » du tutoriel de l'accueil).
  const [summonedSinceHome, setSummonedSinceHome] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0); // menu devs : recharge l'écran après un profil
  const playerFaction = useProfileStore((profile) => profile.faction);
  const ownedUnits = useProfileStore((profile) => profile.units);
  const army = useProfileStore((profile) => profile.army);
  const isWarBattle = WAR_BATTLE_IDS.includes(battleId);

  // GRAPHICS.md « Curseur de la souris » : couleur du curseur selon la faction (pixel-ui.css),
  // posée sur <html> pour couvrir aussi les tooltips et dialogues rendus hors de l'app. Sans
  // faction (intro, choix de faction) : curseur blanc.
  useEffect(() => {
    document.documentElement.dataset.cursor = playerFaction ?? 'none';
  }, [playerFaction]);

  const startBattle = useCallback(() => {
    setBattleAttempt((n) => n + 1);
    setScreen('battle');
  }, []);

  const goHome = useCallback(() => {
    startFountain();
    setScreen('home');
  }, []);

  const startFirstBattle = useCallback((faction) => {
    chooseFaction(faction);
    setBattleId(FIRST_BATTLE_ID);
    startBattle();
  }, [startBattle]);

  // rules.md 11.7 : lance une bataille de « Partir en guerre » avec l'armée.
  const startWarBattle = useCallback((id) => {
    setBattleId(id);
    startBattle();
  }, [startBattle]);

  // technical.md 5.4 : dans la bataille 01, pertes et XP ne sont comptées qu'à la victoire — une
  // tentative ratée ne change rien au profil.
  const handleVictory = useCallback((battle) => {
    setVictoryProgress(applyVictory(battleId, battle.units));
    setScreen('victory');
  }, [battleId]);

  // Menu devs, pendant la bataille 01 (rules.md 11) : comptée comme gagnée sans combat (aucune
  // perte, armée de départ avec toute la dotation, récompense et XP fixe du joueur), puis retour
  // direct à l'accueil.
  const skipFirstBattle = useCallback(() => {
    applyVictory(FIRST_BATTLE_ID, []);
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
    setBattleId(FIRST_BATTLE_ID);
    setScreen('intro');
  }, []);

  const devActions = [
    { label: 'restart game', run: restartGame },
    ...(screen === 'battle' && battleId === FIRST_BATTLE_ID
      ? [{ label: 'skip tutorial', run: skipFirstBattle }] : []),
    ...Object.entries(TEST_PROFILES)
      .map(([label, createProfile]) => ({
        label,
        run: () => {
          replaceProfile(createProfile());
          setSaveVersion((v) => v + 1);
          goHome();
        },
      })),
  ];

  // rules.md 2 : bataille 01 = tous les individus possédés ; « Partir en guerre » = l'armée.
  const battleUnits = isWarBattle ? armyUnits(army, ownedUnits) : ownedUnits;

  let content;
  if (screen === 'intro') {
    content = (
      <IntroScreen onContinue={() => setScreen('factionChoice')} />
    );
  } else if (screen === 'factionChoice') {
    content = <FactionChoiceScreen onChoose={startFirstBattle} />;
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
  } else if (screen === 'units' || screen === 'army') {
    content = (
      <CivilizationScreen
        key={screen}
        playerFaction={playerFaction}
        section={screen}
        onBack={goHome}
        onOpenSummon={() => {
          setSummonBack('units');
          setScreen('summon');
        }}
      />
    );
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
        onOpenSummon={() => {
          setSummonBack('home');
          setScreen('summon');
        }}
        onOpenCodex={() => setScreen('codex')}
        onResetGame={restartGame}
        justSummoned={summonedSinceHome}
        onArrived={() => setSummonedSinceHome(false)}
      />
    );
  }

  return (
    <>
      {/* GRAPHICS.md « Interface » : la faction du joueur choisit la teinte des accents (pixel-ui.css) ;
          fond des écrans : noir pour l'intro, le choix de faction et la bataille (la marge autour
          de la tour et du terrain se fond avec eux), dégradé vertical #2a2c2f → #838796 pour les
          autres (l'accueil le couvre de son château). */}
      <div
        data-faction={playerFaction ?? undefined}
        className={`h-full p-game ${['intro', 'factionChoice', 'battle'].includes(screen)
          ? 'bg-neutral-900'
          : 'bg-linear-to-b from-[#2a2c2f] to-[#838796]'}`}
      >
        <Fragment key={saveVersion}>{content}</Fragment>
      </div>
      {import.meta.env.DEV && <DevMenu actions={devActions} />}
    </>
  );
}
