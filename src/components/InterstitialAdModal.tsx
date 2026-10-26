import React, { useState, useEffect } from 'react';
import { sounds } from '../audio/soundManager';
import { addCoins } from '../utils/records';
import { X, Volume2, VolumeX, Sparkles, ExternalLink, ShieldCheck, Coins } from 'lucide-react';

interface InterstitialAdModalProps {
  onClose: (bonusCoinsAwarded: number) => void;
}

const AD_CAMPAIGNS = [
  {
    brand: 'ROSSIGNOL HERO ELITE',
    tagline: 'La technologie Coupe du Monde LCT dans vos virages.',
    description: 'Structure Line Control Technology éliminant le contre-fléchissement pour une trajectoire fluide et une puissance maximale sur neige glacée.',
    cta: 'DÉCOUVRIR LES SKIS DE COURSE',
    url: 'https://www.rossignol.com',
    gradient: 'from-red-600 via-rose-700 to-slate-900',
    badge: 'SPONSOR OFFICIEL FIS',
    iconEmoji: '⛷️',
    visualElement: (
      <svg className="w-24 h-24 text-white/90 drop-shadow-2xl animate-pulse" viewBox="0 0 100 100" fill="none">
        <polygon points="50,10 90,85 10,85" stroke="currentColor" strokeWidth="4" fill="rgba(255,255,255,0.15)" strokeLinejoin="round" />
        <line x1="50" y1="10" x2="50" y2="85" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
  },
  {
    brand: 'VAL THORENS 2300M',
    tagline: 'Le plus haut domaine skiable d’Europe vous attend.',
    description: '600 km de pistes interconnectées des 3 Vallées. Neige garantie de novembre à mai avec vue panoramique sur 6 glaciers alpins.',
    cta: 'RÉSERVER VOTRE FORFAIT SAISON',
    url: 'https://www.valthorens.com',
    gradient: 'from-blue-700 via-cyan-800 to-slate-950',
    badge: 'STATION DE SKI N°1 MONDIALE',
    iconEmoji: '🏔️',
    visualElement: (
      <svg className="w-24 h-24 text-cyan-300 drop-shadow-2xl" viewBox="0 0 100 100" fill="none">
        <polygon points="50,15 85,80 15,80" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="4" />
        <polygon points="25,40 55,80 0,80" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="3" />
        <polygon points="75,45 100,80 50,80" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="3" />
        <path d="M 50 15 L 62 38 L 50 33 L 38 38 Z" fill="#ffffff" />
      </svg>
    ),
  },
  {
    brand: 'OAKLEY PRIZM™ SNOW',
    tagline: 'Distinguez chaque relief et plaque de verglas en un clin d’œil.',
    description: 'Technologie de verres haute définition calibrée pour maximiser les contrastes de la neige et éliminer l’éblouissement solaire à haute altitude.',
    cta: 'ESSAYER LES MASQUES DE SKI',
    url: 'https://www.oakley.com',
    gradient: 'from-amber-600 via-orange-800 to-slate-950',
    badge: 'OPTIQUE HAUTE DÉFINITION',
    iconEmoji: '🥽',
    visualElement: (
      <svg className="w-28 h-16 text-amber-400 drop-shadow-2xl" viewBox="0 0 120 70" fill="none">
        <rect x="10" y="15" width="45" height="40" rx="15" stroke="currentColor" strokeWidth="4" fill="rgba(245,158,11,0.2)" />
        <rect x="65" y="15" width="45" height="40" rx="15" stroke="currentColor" strokeWidth="4" fill="rgba(245,158,11,0.2)" />
        <path d="M 55 35 Q 60 30 65 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="20" y1="25" x2="45" y2="25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <line x1="75" y1="25" x2="100" y2="25" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </svg>
    ),
  },
];

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({ onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isAdMuted, setIsAdMuted] = useState(false);
  const [campaign] = useState(() => {
    const randomIndex = Math.floor(Math.random() * AD_CAMPAIGNS.length);
    return AD_CAMPAIGNS[randomIndex];
  });

  const BONUS_REWARD = 50;

  useEffect(() => {
    // 5-second countdown timer
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSkipOrClose = () => {
    sounds.playClick();
    addCoins(BONUS_REWARD);
    onClose(BONUS_REWARD);
  };

  const progressPercent = Math.max(0, 100 - (secondsRemaining / 5) * 100);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className={`relative max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br ${campaign.gradient} text-white flex flex-col justify-between min-h-[480px]`}>
        
        {/* Top Bar with ad indicators and countdown */}
        <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/20">
              Annonce Publicitaire (1 sur 2 parties)
            </span>
            <div className="flex items-center gap-1 text-[11px] text-amber-300 font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{BONUS_REWARD} pièces offertes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdMuted(!isAdMuted)}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white transition-colors"
            >
              {isAdMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {canSkip ? (
              <button
                onClick={handleSkipOrClose}
                className="px-3.5 py-1.5 bg-white text-slate-950 font-black text-xs rounded-xl shadow-lg hover:bg-slate-200 transition-all flex items-center gap-1 animate-pulse"
              >
                <span>Passer l’annonce</span>
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="px-3 py-1 bg-black/60 rounded-xl text-xs font-mono font-bold text-slate-300 border border-white/10">
                Passer dans {secondsRemaining}s
              </div>
            )}
          </div>
        </div>

        {/* Progress line */}
        <div className="w-full bg-black/50 h-1">
          <div
            className="bg-cyan-400 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ad Center Content */}
        <div className="p-6 md:p-8 flex flex-col items-center text-center my-auto">
          <div className="mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white/90">
              {campaign.badge}
            </span>
          </div>

          <div className="my-3 flex items-center justify-center">
            {campaign.visualElement}
          </div>

          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
            {campaign.brand}
          </h3>

          <p className="text-sm font-semibold text-cyan-200 mt-1 max-w-sm drop-shadow">
            {campaign.tagline}
          </p>

          <p className="text-xs text-white/80 mt-3 max-w-sm leading-relaxed">
            {campaign.description}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <a
              href={campaign.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playClick()}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
            >
              <span>{campaign.cta}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-black/40 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Monétisation iOS & Annonce conforme App Store</span>
          </div>

          <div className="flex items-center gap-1 text-amber-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Merci pour votre soutien !</span>
          </div>
        </div>
      </div>
    </div>
  );
};
