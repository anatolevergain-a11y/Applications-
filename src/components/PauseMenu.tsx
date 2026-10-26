import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseMenuProps {
  difficultyStage: string;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onToggleMute: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  difficultyStage,
  isMuted,
  onResume,
  onRestart,
  onMenu,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 select-none">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white">PAUSE</h2>
        <p className="text-xs text-slate-400 mt-1">{difficultyStage}</p>

        <div className="flex flex-col gap-2.5 w-full mt-6">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>REPRENDRE LA DESCENTE</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RECOMMENCER DU DÉPART</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'ACTIVER LE SON' : 'COUPER LE SON'}</span>
          </button>

          <button
            onClick={onMenu}
            className="w-full py-2.5 px-4 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
