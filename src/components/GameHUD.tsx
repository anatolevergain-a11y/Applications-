import React from 'react';
import { PlayerState, TimeOfDayState, GameRecords } from '../types/game';
import { Heart, Volume2, VolumeX, Pause, Sparkles, Wind, Clock, Trophy, Sun, Moon, Sunset, Sunrise, Target, Zap } from 'lucide-react';
import { formatGameTime } from '../utils/records';

interface GameHUDProps {
  player: PlayerState;
  timeOfDay: TimeOfDayState;
  records: GameRecords;
  isMuted: boolean;
  floatingText: string | null;
  trickText: string | null;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  timeOfDay,
  records,
  isMuted,
  floatingText,
  trickText,
  onToggleMute,
  onPause,
}) => {
  const isBeatingRecord = player.elapsedTimeSec > records.bestTimeSec && records.bestTimeSec > 0;

  function renderPhaseIcon() {
    switch (timeOfDay.phase) {
      case 'day':
        return <Sun className="w-3.5 h-3.5 text-amber-300" />;
      case 'sunset':
        return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
      case 'night':
        return <Moon className="w-3.5 h-3.5 text-cyan-300" />;
      case 'dawn':
        return <Sunrise className="w-3.5 h-3.5 text-pink-300" />;
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 z-20">
      {/* Damage Flash Red Vignette */}
      {player.invincibleTimer > 0 && (
        <div className="absolute inset-0 bg-red-600/20 pointer-events-none transition-opacity duration-150 animate-pulse" />
      )}

      {/* TOP BAR: Status clusters */}
      <div className="flex items-start justify-between w-full">
        {/* Left Status: Difficulty Stage, Speedometer, Distance, Time of Day */}
        <div className="flex flex-col gap-1.5">
          {/* Dynamic Difficulty Stage & Day-Night Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-slate-950 shadow-md transition-colors"
              style={{ backgroundColor: player.currentDifficultyColor }}
            >
              {player.currentDifficultyStage}
            </span>

            {/* Time of Day Cycle Badge */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-200 shadow-md">
              {renderPhaseIcon()}
              <span>{timeOfDay.phaseLabel}</span>
            </div>
          </div>

          {/* Speedometer Gauge */}
          <div className="flex items-baseline gap-2 bg-slate-900/80 border border-white/10 px-3.5 py-1.5 rounded-xl shadow-lg w-fit">
            <Wind className="w-4 h-4 text-cyan-400 self-center" />
            <span className="text-2xl font-black text-white tabular-nums tracking-tight font-mono">
              {player.speedKmh}
            </span>
            <span className="text-xs font-bold text-slate-300">KM/H</span>
            {player.isCrouching && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-500/80 text-white rounded ml-1 animate-pulse">
                Tuck
              </span>
            )}
            {player.isSlidingOnIce && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-cyan-400/80 text-slate-950 rounded ml-1">
                Verglas !
              </span>
            )}
          </div>

          {/* Distance Counter */}
          <div className="bg-slate-900/80 border border-white/10 px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-2 w-fit">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Distance :</span>
            <span className="text-base font-black text-cyan-300 font-mono tabular-nums">
              {Math.round(player.z).toLocaleString()} m
            </span>
          </div>
        </div>

        {/* Center Banner: Live Stopwatch + Floating Alerts */}
        <div className="flex flex-col items-center">
          {/* Live Chronometer & Record Tracker */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 px-4 py-1.5 rounded-2xl shadow-xl">
            <Clock className={`w-4 h-4 ${isBeatingRecord ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
            <span className="text-xl font-black text-white font-mono tabular-nums tracking-wide">
              {formatGameTime(player.elapsedTimeSec)}
            </span>
            {records.bestTimeSec > 0 && (
              <div className="flex items-center gap-1 border-l border-white/15 pl-2 text-xs font-semibold text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <span className="font-mono tabular-nums">{formatGameTime(records.bestTimeSec)}</span>
              </div>
            )}
          </div>

          {isBeatingRecord && (
            <div className="mt-1 px-2.5 py-0.5 bg-amber-500/90 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
              🏆 Record battu en direct !
            </div>
          )}

          {floatingText && (
            <div className="mt-2 animate-bounce bg-amber-500 text-slate-950 px-4 py-1.5 rounded-full font-black text-sm tracking-wide shadow-xl flex items-center gap-1.5 border border-amber-300">
              <Sparkles className="w-4 h-4 text-white" />
              <span>{floatingText}</span>
            </div>
          )}

          {trickText && (
            <div className="mt-1 bg-cyan-500 text-slate-950 px-4 py-1.5 rounded-full font-black text-sm tracking-wide shadow-xl border border-cyan-300">
              ⚡ {trickText}
            </div>
          )}

          {player.combo > 1 && (
            <div className="mt-1 bg-slate-900/90 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-extrabold text-amber-300 tracking-wider shadow-md">
              COMBO SLALOM x{player.combo}
            </div>
          )}
        </div>

        {/* Right Status: Score, Temporary Multiplier Bonus, Health Hearts, Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Controls: Mute, Pause */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 transition-colors shadow-md"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
              aria-label="Sound toggle"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 transition-colors shadow-md"
              title="Pause (Échap)"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Score Box & Temporary Multiplier */}
          <div className="bg-slate-900/80 border border-white/10 px-4 py-1.5 rounded-xl text-right shadow-lg">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</div>
            <div className="text-2xl font-black text-amber-400 font-mono tabular-nums leading-tight">
              {player.score.toLocaleString()}
            </div>
          </div>

          {/* Active Score Multiplier Glow Banner */}
          {player.scoreMultiplierBonus && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 px-3 py-1 rounded-xl font-black text-xs shadow-lg shadow-amber-500/30 animate-pulse border border-amber-200">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>SCORE x{player.scoreMultiplierBonus.multiplier}</span>
              <span className="font-mono text-[10px] bg-slate-950/20 px-1 rounded">
                {player.scoreMultiplierBonus.remainingTimeSec.toFixed(1)}s
              </span>
            </div>
          )}

          {/* Health Hearts */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-xl shadow-md">
            {[1, 2, 3].map((heartIndex) => (
              <Heart
                key={heartIndex}
                className={`w-5 h-5 transition-transform duration-200 ${
                  heartIndex <= player.health
                    ? 'text-red-500 fill-red-500 scale-100'
                    : 'text-slate-600 fill-transparent scale-90 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE-LEFT or BOTTOM: Active Challenge Card */}
      <div className="w-full flex items-end justify-between pb-2">
        {/* Temporary Challenge Card (Low-occlusion, positioned neatly) */}
        {player.activeChallenge ? (
          <div className="bg-slate-900/90 border border-amber-400/40 p-3 rounded-2xl shadow-2xl backdrop-blur-none max-w-xs pointer-events-auto">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-black text-amber-400 flex items-center gap-1.5 tracking-wide">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                DÉFI : {player.activeChallenge.title}
              </span>
              <span className="font-mono text-[11px] text-slate-200 font-black bg-slate-800 px-2 py-0.5 rounded-full border border-white/10">
                ⏳ {Math.max(0, Math.ceil(player.activeChallenge.remainingTimeSec))}s
              </span>
            </div>

            <p className="text-[11px] text-slate-200 font-medium leading-snug">
              {player.activeChallenge.description}
            </p>

            {/* Progress Bar */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <span>Progression</span>
              <span className="text-cyan-300 font-mono">
                {player.activeChallenge.currentCount} / {player.activeChallenge.targetCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-100"
                style={{
                  width: `${Math.min(100, Math.max(0, (player.activeChallenge.currentCount / player.activeChallenge.targetCount) * 100))}%`,
                }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[9px] text-amber-300 font-bold">
              <span>RÉCOMPENSE :</span>
              <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
                +{player.activeChallenge.rewardPoints} pts & Multiplicateur x{player.activeChallenge.rewardMultiplier} ({player.activeChallenge.rewardMultiplierDurationSec}s)
              </span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* BOTTOM CENTER: Flat control helper reminder */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/70 border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-slate-300">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-white">A / D</kbd> ou <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-white">← / →</kbd> Virages</span>
          <span className="text-slate-600">·</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-white">Espace</kbd> Saut & Tremplin</span>
          <span className="text-slate-600">·</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-white">S / ↓</kbd> Vitesse (Tuck)</span>
        </div>

        <div className="w-0" />
      </div>
    </div>
  );
};
