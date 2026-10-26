import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameMode, PlayerState, TimeOfDayState, GameRecords, CustomizationState } from './types/game';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseMenu } from './components/PauseMenu';
import { TouchControls } from './components/TouchControls';
import { ShopModal } from './components/ShopModal';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { sounds } from './audio/soundManager';
import { getSavedRecords, saveRecordsIfBetter } from './utils/records';
import { getSavedCustomization, getEquippedSkin, getEquippedSki } from './utils/customization';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level UI state
  const [mode, setMode] = useState<GameMode>('title');
  const [isMuted, setIsMuted] = useState(false);
  const [records, setRecords] = useState<GameRecords>(getSavedRecords());
  const [customization, setCustomization] = useState<CustomizationState>(getSavedCustomization());

  // Modals state
  const [showShop, setShowShop] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);

  // Player & Environment state updated by engine
  const [playerState, setPlayerState] = useState<PlayerState>({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vz: 0,
    vy: 0,
    speedKmh: 50,
    isGrounded: true,
    isJumping: false,
    isCrouching: false,
    isSlidingOnIce: false,
    rotationY: 0,
    leanAngle: 0,
    pitchAngle: 0,
    currentTrick: null,
    airTime: 0,
    health: 3,
    score: 0,
    coinsEarned: 0,
    combo: 0,
    maxCombo: 0,
    gatesCleared: 0,
    invincibleTimer: 0,
    isCrashing: false,
    elapsedTimeSec: 0,
    currentDifficultyStage: 'Piste Verte · Échauffement',
    currentDifficultyColor: '#22c55e',
    activeChallenge: null,
    scoreMultiplierBonus: null,
  });

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDayState>({
    phase: 'day',
    phaseLabel: 'Plein Jour Alpin',
    cycleProgress: 0,
    sunIntensity: 1.45,
    skyColor: '#bfe0f7',
    fogColor: '#bfe0f7',
  });

  // End game stats
  const [gameResult, setGameResult] = useState<{
    score: number;
    distance: number;
    timeSec: number;
    coinsEarned: number;
    isNewBestTime: boolean;
    isNewBestDistance: boolean;
    isNewBestScore: boolean;
  }>({
    score: 0,
    distance: 0,
    timeSec: 0,
    coinsEarned: 0,
    isNewBestTime: false,
    isNewBestDistance: false,
    isNewBestScore: false,
  });

  // Floating notifications
  const [floatingText, setFloatingText] = useState<string | null>(null);
  const [trickText, setTrickText] = useState<string | null>(null);
  const floatTimerRef = useRef<number | null>(null);
  const trickTimerRef = useRef<number | null>(null);

  // Helper to synchronize 3D skier appearance with equipped skins & skis
  const syncSkierAppearance = useCallback((customState: CustomizationState) => {
    if (!engineRef.current) return;
    const skin = getEquippedSkin(customState);
    const ski = getEquippedSki(customState);
    engineRef.current.updateSkierAppearance(
      skin.jacketColor,
      skin.accentColor,
      skin.gogglesColor,
      ski.skiColor,
      ski.roughness,
      ski.metalness
    );
  }, []);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onStateUpdate: (state, tod) => {
        setPlayerState(state);
        setTimeOfDay(tod);
      },
      onGameOver: (finalScore, distance, timeSec, coinsEarned) => {
        const { records: updatedRecords, isNewBestTime, isNewBestDistance, isNewBestScore, newGamesCount } =
          saveRecordsIfBetter(timeSec, distance, finalScore, coinsEarned);

        setRecords(updatedRecords);
        setGameResult({
          score: finalScore,
          distance,
          timeSec,
          coinsEarned,
          isNewBestTime,
          isNewBestDistance,
          isNewBestScore,
        });

        if (isNewBestTime || isNewBestDistance) {
          sounds.playVictory();
        }

        // Show interstitial ad every 2 games (runs % 2 === 0)
        if (newGamesCount % 2 === 0) {
          setShowInterstitialAd(true);
        } else {
          setMode('gameover');
        }
      },
      onGatePassed: (combo, points) => {
        if (floatTimerRef.current) clearTimeout(floatTimerRef.current);
        setFloatingText(`PORTE +${points} (x${combo}) · +10 🪙`);
        floatTimerRef.current = window.setTimeout(() => setFloatingText(null), 1200);
      },
      onTrickLanded: (trick, points) => {
        if (trickTimerRef.current) clearTimeout(trickTimerRef.current);
        setTrickText(`${trick.toUpperCase()} +${points} PTS · +25 🪙`);
        trickTimerRef.current = window.setTimeout(() => setTrickText(null), 1600);
      },
      onDamageTaken: () => {
        if (floatTimerRef.current) clearTimeout(floatTimerRef.current);
        setFloatingText('IMPACT !');
        floatTimerRef.current = window.setTimeout(() => setFloatingText(null), 900);
      },
      onChallengeCompleted: (ch, pts, mult, dur) => {
        if (floatTimerRef.current) clearTimeout(floatTimerRef.current);
        setFloatingText(`DÉFI RÉUSSI ! +${pts} PTS (SCORE x${mult} !) · +50 🪙`);
        floatTimerRef.current = window.setTimeout(() => setFloatingText(null), 2500);
      },
      onChallengeFailed: () => {
        // Expired notification
      },
      onChallengeStarted: (ch) => {
        if (trickTimerRef.current) clearTimeout(trickTimerRef.current);
        setTrickText(`NOUVEAU DÉFI : ${ch.title.toUpperCase()}`);
        trickTimerRef.current = window.setTimeout(() => setTrickText(null), 1800);
      },
    });

    engineRef.current = engine;

    // Apply saved appearance immediately
    const skin = getEquippedSkin(customization);
    const ski = getEquippedSki(customization);
    engine.updateSkierAppearance(
      skin.jacketColor,
      skin.accentColor,
      skin.gogglesColor,
      ski.skiColor,
      ski.roughness,
      ski.metalness
    );

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(() => {
    sounds.playClick();
    if (engineRef.current) {
      engineRef.current.resetGame();
      syncSkierAppearance(customization);
      engineRef.current.setMode('playing');
    }
    setMode('playing');
  }, [customization, syncSkierAppearance]);

  const handleResume = useCallback(() => {
    sounds.playClick();
    if (engineRef.current) {
      engineRef.current.setMode('playing');
    }
    setMode('playing');
  }, []);

  const handlePause = useCallback(() => {
    sounds.playClick();
    if (engineRef.current) {
      engineRef.current.setMode('paused');
    }
    setMode('paused');
  }, []);

  const handleRestart = useCallback(() => {
    sounds.playClick();
    if (engineRef.current) {
      engineRef.current.resetGame();
      syncSkierAppearance(customization);
      engineRef.current.setMode('playing');
    }
    setMode('playing');
  }, [customization, syncSkierAppearance]);

  const handleBackToMenu = useCallback(() => {
    sounds.playClick();
    setRecords(getSavedRecords());
    if (engineRef.current) {
      engineRef.current.setMode('title');
    }
    setMode('title');
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleUpdateCustomization = useCallback((newCust: CustomizationState) => {
    setCustomization(newCust);
    syncSkierAppearance(newCust);
  }, [syncSkierAppearance]);

  const handleUpdateCoins = useCallback((newCoins: number) => {
    setRecords((prev) => ({ ...prev, totalCoins: newCoins }));
  }, []);

  const handleCloseAd = useCallback((bonusCoins: number) => {
    setShowInterstitialAd(false);
    setRecords((prev) => ({ ...prev, totalCoins: prev.totalCoins + bonusCoins }));
    setMode('gameover');
  }, []);

  // Keyboard shortcut for Esc (pause), Space / Enter (start)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showShop || showInterstitialAd) {
        if (e.code === 'Escape') {
          setShowShop(false);
        }
        return;
      }

      if (e.code === 'Escape') {
        if (mode === 'playing') {
          handlePause();
        } else if (mode === 'paused') {
          handleResume();
        }
      } else if ((e.code === 'Enter' || e.code === 'Space') && mode === 'title') {
        e.preventDefault();
        handleStartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, showShop, showInterstitialAd, handlePause, handleResume, handleStartGame]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-['Outfit',sans-serif] touch-none select-none">
      {/* 1. Isolated WebGL Three.js Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab" />

      {/* 2. Title Screen */}
      {mode === 'title' && (
        <TitleScreen
          records={records}
          isMuted={isMuted}
          onStartGame={handleStartGame}
          onToggleMute={handleToggleMute}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {/* 3. In-Game HUD */}
      {mode === 'playing' && (
        <>
          <GameHUD
            player={playerState}
            timeOfDay={timeOfDay}
            records={records}
            isMuted={isMuted}
            floatingText={floatingText}
            trickText={trickText}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
          />
          <TouchControls
            onSteerChange={(val) => engineRef.current?.setTouchSteer(val)}
            onJump={() => engineRef.current?.triggerJump()}
            onTuckChange={(val) => {
              if (engineRef.current) {
                engineRef.current.keysHeld.down = val;
              }
            }}
          />
        </>
      )}

      {/* 4. Pause Menu */}
      {mode === 'paused' && (
        <PauseMenu
          difficultyStage={playerState.currentDifficultyStage}
          isMuted={isMuted}
          onResume={handleResume}
          onRestart={handleRestart}
          onMenu={handleBackToMenu}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 5. Interstitial Ad (every 2 games) */}
      {showInterstitialAd && (
        <InterstitialAdModal onClose={handleCloseAd} />
      )}

      {/* 6. Game Over Modal */}
      {mode === 'gameover' && !showInterstitialAd && (
        <GameOverModal
          score={gameResult.score}
          distance={gameResult.distance}
          timeSec={gameResult.timeSec}
          coinsEarned={gameResult.coinsEarned}
          records={records}
          isNewBestTime={gameResult.isNewBestTime}
          isNewBestDistance={gameResult.isNewBestDistance}
          isNewBestScore={gameResult.isNewBestScore}
          difficultyStage={playerState.currentDifficultyStage}
          onRetry={handleRestart}
          onMenu={handleBackToMenu}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {/* 7. Boutique & Skier Customization Modal */}
      {showShop && (
        <ShopModal
          customization={customization}
          totalCoins={records.totalCoins}
          onUpdateCustomization={handleUpdateCustomization}
          onUpdateCoins={handleUpdateCoins}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
