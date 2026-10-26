import React from 'react';
import { GameRecords } from '../types/game';
import { RotateCcw, Home, Trophy, Clock, Milestone, Flame, Coins, ShoppingBag } from 'lucide-react';
import { formatGameTime } from '../utils/records';

interface GameOverModalProps {
  score: number;
  distance: number;
  timeSec: number;
  coinsEarned: number;
  records: GameRecords;
  isNewBestTime: boolean;
  isNewBestDistance: boolean;
  isNewBestScore: boolean;
  difficultyStage: string;
  onRetry: () => void;
  onMenu: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  distance,
  timeSec,
  coinsEarned,
  records,
  isNewBestTime,
  isNewBestDistance,
  isNewBestScore,
  difficultyStage,
  onRetry,
  onMenu,
  onOpenShop,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Icon Header */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          isNewBestTime || isNewBestDistance ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isNewBestTime || isNewBestDistance ? <Trophy className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black text-white">
          {isNewBestTime ? 'NOUVEAU RECORD DE TEMPS !' : 'CHUTE DANS LA POUDREUSE'}
        </h2>
        <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">
          Fin de descente sur la section : <span className="font-bold text-cyan-300">{difficultyStage}</span>
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full my-5 text-left">
          {/* Time survived */}
          <div className={`p-3 rounded-xl border relative ${
            isNewBestTime ? 'bg-amber-500/15 border-amber-500/40' : 'bg-slate-800/70 border-white/5'
          }`}>
            {isNewBestTime && (
              <span className="absolute -top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded">
                Record !
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>TEMPS</span>
            </div>
            <span className="text-lg font-black text-white font-mono tabular-nums block">
              {formatGameTime(timeSec)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Rec: {formatGameTime(records.bestTimeSec)}
            </span>
          </div>

          {/* Distance */}
          <div className={`p-3 rounded-xl border relative ${
            isNewBestDistance ? 'bg-amber-500/15 border-amber-500/40' : 'bg-slate-800/70 border-white/5'
          }`}>
            {isNewBestDistance && (
              <span className="absolute -top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded">
                Record !
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              <Milestone className="w-3 h-3 text-cyan-400" />
              <span>DISTANCE</span>
            </div>
            <span className="text-lg font-black text-cyan-300 font-mono tabular-nums block">
              {distance} m
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Rec: {records.bestDistanceM} m
            </span>
          </div>

          {/* Score */}
          <div className={`p-3 rounded-xl border relative ${
            isNewBestScore ? 'bg-amber-500/15 border-amber-500/40' : 'bg-slate-800/70 border-white/5'
          }`}>
            {isNewBestScore && (
              <span className="absolute -top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded">
                Record !
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>SCORE</span>
            </div>
            <span className="text-lg font-black text-amber-400 font-mono tabular-nums block">
              {score.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Rec: {records.bestScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Coins Earned Summary Pill */}
        <div className="w-full bg-slate-800/80 border border-amber-500/30 rounded-xl p-2.5 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">Butin de la course :</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-400 font-mono">+{coinsEarned} pièces</span>
            <span className="text-[10px] text-slate-400 font-mono">(Total : {records.totalCoins})</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onRetry}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-5 h-5 fill-slate-950" />
            <span>RELANCER LA DESCENTE</span>
          </button>

          <button
            onClick={onOpenShop}
            className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Boutique : Changer de Skin & Skis</span>
          </button>

          <button
            onClick={onMenu}
            className="w-full py-2 px-4 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
