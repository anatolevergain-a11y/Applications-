import React from 'react';
import { GameRecords } from '../types/game';
import { Volume2, VolumeX, Play, Trophy, Clock, Milestone, Flame } from 'lucide-react';
import { formatGameTime } from '../utils/records';

interface TitleScreenProps {
  records: GameRecords;
  isMuted: boolean;
  onStartGame: () => void;
  onToggleMute: () => void;
  onOpenShop: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  records,
  isMuted,
  onStartGame,
  onToggleMute,
  onOpenShop,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-10 pointer-events-auto select-none bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/85">
      {/* Top Header: Mute, Coins & Boutique */}
      <div className="flex justify-between items-center w-full flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>SOMMET BLANC · 3D</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Shop button with coins badge */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 transition-all shadow-md active:scale-95"
            title="Ouvrir la boutique de skins et de skis"
          >
            <span>🛍️ Boutique & Skis</span>
            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-mono font-black text-[10px]">
              {records.totalCoins.toLocaleString()} 🪙
            </span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 transition-colors shadow-lg"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke inline SVG title lockup over 35% negative space */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="mb-4">
          <svg className="w-24 h-16 md:w-32 md:h-20 text-cyan-400 drop-shadow-xl mx-auto" viewBox="0 0 120 70" fill="none">
            <polygon points="60,6 88,60 32,60" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="32,24 55,60 9,60" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="88,28 112,60 64,60" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="60,6 69,24 51,24" fill="#ffffff" />
            <polygon points="32,24 39,36 25,36" fill="#ffffff" />
            <polygon points="88,28 95,40 81,40" fill="#ffffff" />
            <path d="M 22 66 Q 60 58 100 66" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 30 70 Q 60 62 92 70" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl font-['Outfit']">
          SOMMET <span className="text-cyan-400">BLANC</span>
        </h1>
        <p className="text-sm md:text-base font-medium text-slate-300 max-w-lg mt-2 drop-shadow">
          Une descente infinie sans fin où la difficulté augmente au fil des kilomètres. Admirez le passage du jour à la nuit et survivez le plus longtemps possible !
        </p>

        {/* Records Hall of Fame Card */}
        <div className="mt-7 w-full max-w-md bg-slate-900/85 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-none text-left">
          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-white/10">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Vos Meilleurs Records
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Best Time */}
            <div className="bg-slate-800/70 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 mb-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>TEMPS RECORD</span>
              </div>
              <span className="text-base font-black text-amber-400 font-mono tabular-nums">
                {records.bestTimeSec > 0 ? formatGameTime(records.bestTimeSec) : '--:--.-'}
              </span>
            </div>

            {/* Best Distance */}
            <div className="bg-slate-800/70 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 mb-1">
                <Milestone className="w-3 h-3 text-cyan-400" />
                <span>DISTANCE</span>
              </div>
              <span className="text-base font-black text-white font-mono tabular-nums">
                {records.bestDistanceM > 0 ? `${records.bestDistanceM} m` : '0 m'}
              </span>
            </div>

            {/* Best Score */}
            <div className="bg-slate-800/70 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 mb-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>SCORE MAX</span>
              </div>
              <span className="text-base font-black text-cyan-300 font-mono tabular-nums">
                {records.bestScore > 0 ? records.bestScore.toLocaleString() : '0'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-400 text-center flex flex-col gap-1">
            <div>
              ☀️ <span className="text-slate-300 font-medium">Jour</span> → 🌅 <span className="text-amber-300 font-medium">Crépuscule</span> → 🌙 <span className="text-cyan-300 font-medium">Nuit & Phare</span> → 🌄 <span className="text-pink-300 font-medium">Aube</span>
            </div>
            <div className="text-[10px] text-amber-300 font-semibold">
              🚨 Dès 3 000 m : Bolides fonçant de face · 🌪️ Dès 5 000 m : Balayeurs oscillant de gauche à droite !
            </div>
          </div>
        </div>

        {/* Start Game CTA */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={onStartGame}
            className="group px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base md:text-lg tracking-wider rounded-xl shadow-xl shadow-cyan-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2.5"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>COMMENCER LA DESCENTE INFINIE</span>
          </button>
          <span className="text-[11px] font-semibold text-slate-400">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded font-mono text-[10px] text-white">Espace</kbd> ou <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded font-mono text-[10px] text-white">Entrée</kbd>
          </span>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="w-full text-center">
        <p className="text-xs text-slate-400 tracking-wide font-medium">
          <span className="text-white font-semibold">Commandes :</span> A/D ou Flèches Gauche/Droite · Espace Saut / Figures · S ou Flèche Bas Vitesse · Échap Pause
        </p>
      </div>
    </div>
  );
};
