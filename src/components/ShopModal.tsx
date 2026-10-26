import React, { useState } from 'react';
import { SkinItem, SkiItem, CustomizationState } from '../types/game';
import { AVAILABLE_SKINS, AVAILABLE_SKIS, saveCustomization } from '../utils/customization';
import { spendCoins, addCoins } from '../utils/records';
import { sounds } from '../audio/soundManager';
import { X, Check, ShoppingBag, Sparkles, Shield, Coins, CreditCard, ChevronRight } from 'lucide-react';

interface ShopModalProps {
  customization: CustomizationState;
  totalCoins: number;
  onUpdateCustomization: (newCustomization: CustomizationState) => void;
  onUpdateCoins: (newTotal: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  customization,
  totalCoins,
  onUpdateCustomization,
  onUpdateCoins,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'skis'>('skins');
  const [selectedSkinId, setSelectedSkinId] = useState<string>(customization.equippedSkinId);
  const [selectedSkiId, setSelectedSkiId] = useState<string>(customization.equippedSkiId);
  
  // Apple Pay / StoreKit simulation modal
  const [purchasingItem, setPurchasingItem] = useState<{
    item: SkinItem | SkiItem;
    type: 'skin' | 'ski';
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const selectedSkin = AVAILABLE_SKINS.find((s) => s.id === selectedSkinId) || AVAILABLE_SKINS[0];
  const selectedSki = AVAILABLE_SKIS.find((s) => s.id === selectedSkiId) || AVAILABLE_SKIS[0];

  const isSkinUnlocked = (id: string) => customization.unlockedSkinIds.includes(id);
  const isSkiUnlocked = (id: string) => customization.unlockedSkiIds.includes(id);

  const handleEquipSkin = (skin: SkinItem) => {
    if (!isSkinUnlocked(skin.id)) return;
    sounds.playClick();
    const updated = { ...customization, equippedSkinId: skin.id };
    saveCustomization(updated);
    onUpdateCustomization(updated);
  };

  const handleEquipSki = (ski: SkiItem) => {
    if (!isSkiUnlocked(ski.id)) return;
    sounds.playClick();
    const updated = { ...customization, equippedSkiId: ski.id };
    saveCustomization(updated);
    onUpdateCustomization(updated);
  };

  const handleBuyWithCoins = (item: SkinItem | SkiItem, type: 'skin' | 'ski') => {
    if (totalCoins < item.priceCoins) {
      sounds.playCrash();
      return;
    }

    if (spendCoins(item.priceCoins)) {
      sounds.playTrickSuccess();
      const newCoins = totalCoins - item.priceCoins;
      onUpdateCoins(newCoins);

      if (type === 'skin') {
        const newUnlocked = [...customization.unlockedSkinIds, item.id];
        const updated = {
          ...customization,
          unlockedSkinIds: newUnlocked,
          equippedSkinId: item.id,
        };
        saveCustomization(updated);
        onUpdateCustomization(updated);
      } else {
        const newUnlocked = [...customization.unlockedSkiIds, item.id];
        const updated = {
          ...customization,
          unlockedSkiIds: newUnlocked,
          equippedSkiId: item.id,
        };
        saveCustomization(updated);
        onUpdateCustomization(updated);
      }
    }
  };

  const handleStartApplePay = (item: SkinItem | SkiItem, type: 'skin' | 'ski') => {
    sounds.playClick();
    setPurchasingItem({ item, type });
    setIsProcessingPayment(false);
    setPaymentSuccess(false);
  };

  const handleConfirmApplePay = () => {
    if (!purchasingItem) return;
    setIsProcessingPayment(true);
    sounds.playClick();

    // Simulate authentic Apple StoreKit Face ID / payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      sounds.playVictory();

      setTimeout(() => {
        const { item, type } = purchasingItem;
        if (type === 'skin') {
          const newUnlocked = [...new Set([...customization.unlockedSkinIds, item.id])];
          const updated = {
            ...customization,
            unlockedSkinIds: newUnlocked,
            equippedSkinId: item.id,
          };
          saveCustomization(updated);
          onUpdateCustomization(updated);
        } else {
          const newUnlocked = [...new Set([...customization.unlockedSkiIds, item.id])];
          const updated = {
            ...customization,
            unlockedSkiIds: newUnlocked,
            equippedSkiId: item.id,
          };
          saveCustomization(updated);
          onUpdateCustomization(updated);
        }
        setPurchasingItem(null);
      }, 1000);
    }, 1200);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-red-500 text-white">Légendaire</span>;
      case 'epic':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">Épique</span>;
      case 'rare':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Rare</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300">Standard</span>;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with coins counter & close button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                BOUTIQUE ALPINE
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">iOS Ready</span>
              </h2>
              <p className="text-xs text-slate-400">Personnalisez votre skieur et vos skis de descente</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins wallet display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{totalCoins.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('skins'); }}
            className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'skins'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Combinaisons de Ski</span>
            <span className="text-xs bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">
              {AVAILABLE_SKINS.length}
            </span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('skis'); }}
            className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'skis'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Planches & Carres</span>
            <span className="text-xs bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">
              {AVAILABLE_SKIS.length}
            </span>
          </button>
        </div>

        {/* Content area: Grid of items */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'skins' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {AVAILABLE_SKINS.map((skin) => {
                const unlocked = isSkinUnlocked(skin.id);
                const isEquipped = customization.equippedSkinId === skin.id;
                const canAfford = totalCoins >= skin.priceCoins;

                return (
                  <div
                    key={skin.id}
                    onClick={() => setSelectedSkinId(skin.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      selectedSkinId === skin.id
                        ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                        : 'bg-slate-800/40 border-white/10 hover:bg-slate-800/70 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          {/* Color swatch avatar */}
                          <div
                            className="w-10 h-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center relative overflow-hidden"
                            style={{ backgroundColor: skin.colorHex }}
                          >
                            <div
                              className="absolute inset-x-0 bottom-0 h-3"
                              style={{ backgroundColor: `#${skin.accentColor.toString(16).padStart(6, '0')}` }}
                            />
                            {isEquipped && <Check className="w-5 h-5 text-white drop-shadow stroke-[3]" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white leading-tight">{skin.name}</h3>
                            <div className="mt-0.5">{getRarityBadge(skin.rarity)}</div>
                          </div>
                        </div>

                        {isEquipped && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Équipé
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{skin.description}</p>
                    </div>

                    {/* Actions bar */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      {unlocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipSkin(skin);
                          }}
                          disabled={isEquipped}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            isEquipped
                              ? 'bg-slate-700/50 text-slate-400 cursor-default'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> En cours d'utilisation
                            </>
                          ) : (
                            'Équiper cette tenue'
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          {/* Buy with Apple Pay (EUR) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartApplePay(skin, 'skin');
                            }}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                          >
                            <span className="font-semibold"> Pay</span>
                            <span>{skin.priceEur.toFixed(2)} €</span>
                          </button>

                          {/* Buy with Coins */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyWithCoins(skin, 'skin');
                            }}
                            disabled={!canAfford}
                            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                              canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{skin.priceCoins}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {AVAILABLE_SKIS.map((ski) => {
                const unlocked = isSkiUnlocked(ski.id);
                const isEquipped = customization.equippedSkiId === ski.id;
                const canAfford = totalCoins >= ski.priceCoins;

                return (
                  <div
                    key={ski.id}
                    onClick={() => setSelectedSkiId(ski.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                      selectedSkiId === ski.id
                        ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                        : 'bg-slate-800/40 border-white/10 hover:bg-slate-800/70 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          {/* Ski pair visual preview */}
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/15 shadow-md flex items-center justify-center gap-1">
                            <div
                              className="w-1.5 h-7 rounded-sm shadow-sm"
                              style={{ backgroundColor: ski.colorHex }}
                            />
                            <div
                              className="w-1.5 h-7 rounded-sm shadow-sm"
                              style={{ backgroundColor: ski.colorHex }}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white leading-tight">{ski.name}</h3>
                            <div className="mt-0.5">{getRarityBadge(ski.rarity)}</div>
                          </div>
                        </div>

                        {isEquipped && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Équipé
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ski.description}</p>
                    </div>

                    {/* Actions bar */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      {unlocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipSki(ski);
                          }}
                          disabled={isEquipped}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            isEquipped
                              ? 'bg-slate-700/50 text-slate-400 cursor-default'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> En cours d'utilisation
                            </>
                          ) : (
                            'Chausser ces skis'
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          {/* Buy with Apple Pay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartApplePay(ski, 'ski');
                            }}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                          >
                            <span className="font-semibold"> Pay</span>
                            <span>{ski.priceEur.toFixed(2)} €</span>
                          </button>

                          {/* Buy with Coins */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyWithCoins(ski, 'ski');
                            }}
                            disabled={!canAfford}
                            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                              canAfford
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{ski.priceCoins}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Banner: Free Bonus & Coin Tip */}
        <div className="p-4 bg-slate-950/60 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Gagnez des pièces en réussissant des portes, des sauts et les défis temporaires en course !</span>
          </div>
          <button
            onClick={() => {
              sounds.playTrickSuccess();
              addCoins(100);
              onUpdateCoins(totalCoins + 100);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5 transition-colors whitespace-nowrap active:scale-95"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Cadeau Découverte : +100 pièces</span>
          </button>
        </div>
      </div>

      {/* Simulated Apple Pay / StoreKit Sheet */}
      {purchasingItem && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-['Outfit']"> Pay</span>
                <span className="text-xs text-slate-400 font-medium">In-App Purchase</span>
              </div>
              <button
                onClick={() => setPurchasingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 mb-5 bg-slate-800/60 p-3.5 rounded-2xl border border-white/5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner"
                style={{ backgroundColor: purchasingItem.item.colorHex }}
              >
                ⛷️
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{purchasingItem.item.name}</h4>
                <p className="text-xs text-slate-400">Sommet Blanc iOS • Déblocage définitif</p>
                <p className="text-base font-black text-cyan-400 font-mono mt-0.5">
                  {purchasingItem.item.priceEur.toFixed(2)} €
                </p>
              </div>
            </div>

            {paymentSuccess ? (
              <div className="py-6 flex flex-col items-center text-center animate-in zoom-in-90 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/30">
                  <Check className="w-8 h-8 text-slate-950 stroke-[3]" />
                </div>
                <h5 className="font-black text-lg text-white">Achat validé !</h5>
                <p className="text-xs text-slate-300">Votre équipement a été équipé avec succès.</p>
              </div>
            ) : isProcessingPayment ? (
              <div className="py-6 flex flex-col items-center text-center">
                <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-300">Validation StoreKit Face ID en cours...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[11px] text-slate-400 flex items-center justify-between border-y border-white/5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Compte Apple & Facturation sécurisée</span>
                  </div>
                  <span className="font-semibold text-slate-300">App Store</span>
                </div>

                <button
                  onClick={handleConfirmApplePay}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Double-cliquer pour payer ({purchasingItem.item.priceEur.toFixed(2)} €)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
