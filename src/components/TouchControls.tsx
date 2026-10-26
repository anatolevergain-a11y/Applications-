import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

interface TouchControlsProps {
  onSteerChange: (steer: number) => void;
  onJump: () => void;
  onTuckChange: (isTucking: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onSteerChange,
  onJump,
  onTuckChange,
}) => {
  return (
    <div className="md:hidden absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none z-20 select-none">
      {/* Left / Right Steering Pad */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={() => onSteerChange(-1)}
          onTouchEnd={() => onSteerChange(0)}
          onMouseDown={() => onSteerChange(-1)}
          onMouseUp={() => onSteerChange(0)}
          onMouseLeave={() => onSteerChange(0)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-cyan-500 active:text-slate-950 text-white border border-white/15 flex items-center justify-center shadow-xl backdrop-blur-none transition-transform active:scale-95"
          aria-label="Steer left"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onTouchStart={() => onSteerChange(1)}
          onTouchEnd={() => onSteerChange(0)}
          onMouseDown={() => onSteerChange(1)}
          onMouseUp={() => onSteerChange(0)}
          onMouseLeave={() => onSteerChange(0)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-cyan-500 active:text-slate-950 text-white border border-white/15 flex items-center justify-center shadow-xl backdrop-blur-none transition-transform active:scale-95"
          aria-label="Steer right"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Jump & Tuck Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={() => onTuckChange(true)}
          onTouchEnd={() => onTuckChange(false)}
          onMouseDown={() => onTuckChange(true)}
          onMouseUp={() => onTuckChange(false)}
          onMouseLeave={() => onTuckChange(false)}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-amber-500 active:text-slate-950 text-amber-400 border border-white/15 flex flex-col items-center justify-center shadow-xl backdrop-blur-none transition-transform active:scale-95"
          aria-label="Tuck speed"
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[9px] font-bold">VITESSE</span>
        </button>

        <button
          onClick={onJump}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 active:from-cyan-400 active:to-blue-500 text-slate-950 font-black flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95"
          aria-label="Jump"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[10px] uppercase tracking-wider">SAUT</span>
        </button>
      </div>
    </div>
  );
};
