'use client';

/**
 * DICE OVERLAY COMPONENT
 * ----------------------------------------------------------------------------
 * A fullscreen, interactive 3D dice rolling interface.
 * 
 * FUNCTIONALITY:
 * - 3D Rendering: Uses `@3d-dice/dice-box` to physically simulate dice rolls on screen.
 * - Roll Types: 
 *   - Duality Rolls: Standard action rolls using Hope (d12) and Fear (d12) dice, plus optional extras.
 *     Calculates the result based on Daggerheart rules (Critical, Hope, Fear).
 *   - Damage Rolls: Parses die strings (e.g., "d8+2") and rolls red damage dice.
 * - Dice Builder: Allows users to dynamically modify their dice pool by adding/removing dice 
 *   and cycling their roles (Hope, Fear, Extra).
 * - Resource Integration: Enables spending 'Hope' resources to activate Experiences, 
 *   automatically updating the temporary modifier.
 * - Result Feedback: specific visual feedback based on the roll outcome (Hope/Fear/Crit).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, Plus, Trash2 } from '@/lib/icon-utils';
import clsx from 'clsx';
import { toast } from 'sonner';
import { parseDiceNotation } from '@/lib/dice';
import { Z_INDEX } from '@/constants/z-index';

type DiceRole = 'hope' | 'fear' | 'plus' | 'minus' | 'damage';

/**
 * Resolves a CSS variable to its computed hex value.
 * The @3d-dice/dice-box library requires actual color values, not CSS variable references.
 */
function getCssVariableValue(varName: string): string {
  if (typeof window === 'undefined') return '#000000';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000';
}

interface DieConfig {
  id: string;
  sides: number;
  role: DiceRole;
}

export default function DiceOverlay() {
  const { isDiceOverlayOpen, closeDiceOverlay, setLastRollResult, lastRollResult, activeRoll, character, updateHope, activeCampaign, user, logActivity } = useCharacterStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const boxInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [tempModifier, setTempModifier] = useState(0);
  const [selectedExpIndices, setSelectedExpIndices] = useState<number[]>([]);
  const [hasRolled, setHasRolled] = useState(false);

  // BUILDER STATE
  const [dicePool, setDicePool] = useState<DieConfig[]>([]);

  const diceBoxClassRef = useRef<any>(null);
  const [moduleLoaded, setModuleLoaded] = useState(false);

  const isDamageMode = !!activeRoll?.dice;

  // Reset state when overlay opens
  useEffect(() => {
    if (isDiceOverlayOpen) {
      setTempModifier(0);
      setSelectedExpIndices([]);
      setHasRolled(false);
      if (activeRoll?.dice) {
        // Parse damage notation into builder pool
        const parsed = parseDiceNotation(activeRoll.dice, activeRoll.diceColor || 'var(--dice-damage)');
        setDicePool(parsed.diceConfig.map((d, i) => ({
          id: `dmg-${i}`,
          sides: d.sides,
          role: 'damage' as DiceRole
        })));
      } else {
        // Default Pool: 1 Hope (d12), 1 Fear (d12)
        setDicePool([
          { id: 'default-hope', sides: 12, role: 'hope' },
          { id: 'default-fear', sides: 12, role: 'fear' }
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiceOverlayOpen]);

  // Calculate Experience Modifiers
  const playerExperiences = character?.experiences || [];
  const companionExperiences = character?.ranger_companion?.experiences || [];
  const experiences = [
    ...playerExperiences.map(exp => ({ ...exp, source: 'player' as const })),
    ...companionExperiences.map(exp => ({ ...exp, source: 'companion' as const }))
  ];
  const experienceModifier = selectedExpIndices.reduce((sum, idx) => sum + (experiences[idx]?.value || 0), 0);
  const hopeCost = selectedExpIndices.length;
  const currentHope = character?.hope || 0;

  // Toggle Experience Selection
  const toggleExperience = (index: number) => {
    if (selectedExpIndices.includes(index)) {
      setSelectedExpIndices(prev => prev.filter(i => i !== index));
    } else {
      if (currentHope - hopeCost >= 1) {
        setSelectedExpIndices(prev => [...prev, index]);
      }
    }
  };

  // Builder Handlers
  const addDie = (sides: number) => {
    const defaultRole: DiceRole = isDamageMode ? 'damage' : 'plus';
    setDicePool(prev => [...prev, { id: crypto.randomUUID(), sides, role: defaultRole }]);
  };

  const removeDie = (id: string) => {
    setDicePool(prev => prev.filter(d => d.id !== id));
  };

  const cycleRole = (id: string) => {
    const roles: DiceRole[] = isDamageMode
      ? ['damage', 'plus', 'minus']
      : ['plus', 'minus', 'hope', 'fear'];
    setDicePool(prev => prev.map(d => {
      if (d.id !== id) return d;
      const idx = roles.indexOf(d.role);
      return { ...d, role: roles[(idx + 1) % roles.length] };
    }));
  };

  // Load module on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !moduleLoaded) {
      import('@3d-dice/dice-box')
        .then(module => {
          diceBoxClassRef.current = module.default;
          setModuleLoaded(true);
        })
        .catch(e => console.error("Failed to load DiceBox module:", e));
    }
  }, [moduleLoaded]);

  // Initialize DiceBox
  useEffect(() => {
    if (!containerRef.current || boxInstanceRef.current || !moduleLoaded || !diceBoxClassRef.current) return;

    const DiceBox = diceBoxClassRef.current;
    const box = new DiceBox({
      container: "#dice-tray-overlay",
      assetPath: '/assets/',
      scale: 5,
      theme: 'default',
      offscreen: true,
      gravity_multiplier: 400,
      light_intensity: 0.8,
      enable_shadows: false,
      shadow_transparency: 0.4,
    });

    boxInstanceRef.current = box;

    const handleResize = () => {
      if (boxInstanceRef.current && typeof boxInstanceRef.current.resize === 'function') {
        try {
          boxInstanceRef.current.resize();
        } catch (e) {
          console.warn('DiceBox resize failed:', e);
        }
      }
    };
    window.addEventListener('resize', handleResize);

    try {
      box.init().then(() => {
        if (boxInstanceRef.current) {
          setIsReady(true);
        }
      });
    } catch (e) {
      console.error("DiceBox init error:", e);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [moduleLoaded]);

  // Trigger resize
  useEffect(() => {
    if (isDiceOverlayOpen && boxInstanceRef.current && isReady) {
      setTimeout(() => {
        if (boxInstanceRef.current && typeof boxInstanceRef.current.resize === 'function') {
          try {
            boxInstanceRef.current.resize();
          } catch (e) {
            console.warn('DiceBox resize on overlay open failed:', e);
          }
        }
      }, 50);
    }
  }, [isDiceOverlayOpen, isReady]);

  const handleRoll = async () => {
    if (!boxInstanceRef.current || !isReady) {
      console.warn("DiceBox not ready");
      toast.error("Dice roller is initializing...");
      return;
    }

    // Mark that we've rolled to trigger UI fade
    setHasRolled(true);
    console.log('[DiceOverlay] handleRoll called:', {
      hasActiveCampaign: !!activeCampaign,
      campaignId: activeCampaign?.id,
      hasUser: !!user,
      userId: user?.id,
      hasCharacter: !!character,
      characterName: character?.name,
    });

    if (hopeCost > 0) {
      await updateHope(currentHope - hopeCost);
    }

    const baseModifier = activeRoll?.modifier || 0;
    const totalModifier = baseModifier + tempModifier + experienceModifier;

    boxInstanceRef.current.clear();

    // Case 1: Damage Roll (uses builder pool)
    if (activeRoll?.dice) {
      // Parse the original notation for any static modifier (e.g., +3 in "2d8+3")
      const parsed = parseDiceNotation(activeRoll.dice, activeRoll.diceColor || 'var(--dice-damage)');
      const stringModifier = parsed.stringModifier;

      setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: totalModifier + stringModifier, type: 'Damage' });
      try {
        if (dicePool.length === 0) {
          if (stringModifier > 0) {
            setLastRollResult({ hope: 0, fear: 0, total: stringModifier + totalModifier, modifier: totalModifier + stringModifier, type: 'Damage' });
            return;
          }
          return;
        }

        const themeColor = activeRoll.diceColor || getCssVariableValue('--dice-damage');
        const diceConfig = dicePool.map(d => ({
          sides: d.sides,
          themeColor: d.role === 'damage' ? themeColor : d.role === 'plus' ? getCssVariableValue('--dice-plus') : getCssVariableValue('--dice-minus')
        }));

        const result = await boxInstanceRef.current.roll(diceConfig);
        let damageTotal = 0;
        let plusTotal = 0;
        let minusTotal = 0;
        const individualDieResults: { role: DiceRole, value: number, sides: number }[] = [];

        if (Array.isArray(result)) {
          result.forEach((die: any, index: number) => {
            const poolDie = dicePool[index];
            individualDieResults.push({ role: poolDie.role, value: die.value, sides: poolDie.sides });
            if (poolDie.role === 'damage' || poolDie.role === 'plus') {
              damageTotal += die.value;
              if (poolDie.role === 'plus') plusTotal += die.value;
            } else if (poolDie.role === 'minus') {
              minusTotal += die.value;
            }
          });
        }

        const finalTotalModifier = totalModifier + stringModifier;
        const damageRollResult = {
          hope: 0,
          fear: 0,
          total: damageTotal - minusTotal + finalTotalModifier,
          modifier: finalTotalModifier,
          type: 'Damage' as const,
          dice: individualDieResults
        };
        setLastRollResult(damageRollResult);

        // Log to activity feed if in a campaign
        if (activeCampaign && user) {
          const isPrivateRoll = activeRoll?.isPrivate || false;
          logActivity({
            campaign_id: activeCampaign.id,
            user_id: user.id,
            character_id: character?.id,
            character_name: activeRoll?.isGmRoll ? 'GM' : (character?.name || 'Unknown'),
            activity_type: 'dice_roll',
            data: {
              roll_type: activeRoll?.isGmRoll ? 'gm_roll' : 'damage',
              dice: individualDieResults.map(d => d.value),
              modifier: finalTotalModifier,
              total: damageRollResult.total,
              description: activeRoll.label || 'Damage Roll',
              is_gm_roll: activeRoll?.isGmRoll || false,
            },
            is_private: isPrivateRoll,
          });
        }
      } catch (e) { console.error("Custom roll failed", e); }
      return;
    }

    // Case 2: Builder Duality Roll
    setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: totalModifier, type: 'Hope' });

    try {
      const diceConfig = dicePool.map(d => ({
        sides: d.sides,
        themeColor: d.role === 'hope' ? getCssVariableValue('--dice-hope')
          : d.role === 'fear' ? getCssVariableValue('--dice-fear')
          : d.role === 'plus' ? getCssVariableValue('--dice-plus')
          : d.role === 'minus' ? getCssVariableValue('--dice-minus')
          : getCssVariableValue('--dice-extra')
      }));

      if (diceConfig.length === 0) {
        console.warn("No dice in pool");
        return;
      }

      const result = await boxInstanceRef.current.roll(diceConfig);

      if (Array.isArray(result)) {
        let hopeRoll = 0;
        let fearRoll = 0;
        let plusTotal = 0;
        let minusTotal = 0;
        const individualDieResults: { role: DiceRole, value: number, sides: number }[] = [];

        dicePool.forEach((die, idx) => {
          const val = result[idx].value;
          individualDieResults.push({ role: die.role, value: val, sides: die.sides });

          if (die.role === 'hope' && hopeRoll === 0) hopeRoll = val;
          else if (die.role === 'fear' && fearRoll === 0) fearRoll = val;
          else if (die.role === 'plus') plusTotal += val;
          else if (die.role === 'minus') minusTotal += val;
        });

        const total = hopeRoll + fearRoll + totalModifier + plusTotal - minusTotal;

        let type: 'Critical' | 'Hope' | 'Fear' | 'Damage' = 'Hope';
        if (hopeRoll === fearRoll && hopeRoll !== 0) type = 'Critical';
        else if (hopeRoll > fearRoll) type = 'Hope';
        else type = 'Fear';

        const dualityRollResult = {
          hope: hopeRoll,
          fear: fearRoll,
          total,
          plusTotal: plusTotal,
          minusTotal: minusTotal,
          modifier: totalModifier,
          type,
          dice: individualDieResults
        };
        setLastRollResult(dualityRollResult);

        // Log to activity feed if in a campaign (respect privacy for GM hidden rolls)
        if (activeCampaign && user) {
          // Determine roll type based on activeRoll label or default to 'trait'
          const rollType = activeRoll?.isGmRoll ? 'gm_roll' : (activeRoll?.dice ? 'custom' : (activeRoll?.label?.toLowerCase().includes('attack') ? 'attack' : 'trait'));
          const isPrivateRoll = activeRoll?.isPrivate || false;

          console.log('[DiceOverlay] Logging DUALITY roll to activity feed:', {
            campaignId: activeCampaign.id,
            userId: user.id,
            characterName: character?.name,
            total: dualityRollResult.total,
            type: dualityRollResult.type,
          });
          logActivity({
            campaign_id: activeCampaign.id,
            user_id: user.id,
            character_id: character?.id,
            character_name: activeRoll?.isGmRoll ? 'GM' : (character?.name || 'Unknown'),
            activity_type: 'dice_roll',
            data: {
              roll_type: rollType as 'attack' | 'damage' | 'trait' | 'spellcast' | 'custom' | 'gm_roll',
              dice: individualDieResults.map(d => d.value),
              modifier: totalModifier,
              total: dualityRollResult.total,
              description: activeRoll?.label || 'Action Roll',
              hope_fear: type === 'Critical' ? 'hope' : type.toLowerCase() as 'hope' | 'fear',
              is_gm_roll: activeRoll?.isGmRoll || false,
            },
            is_private: isPrivateRoll,
          });
        } else {
          console.log('[DiceOverlay] NOT logging DUALITY roll - missing campaign or user:', {
            hasActiveCampaign: !!activeCampaign,
            hasUser: !!user,
          });
        }
      }
    } catch (e) {
      console.error("Roll failed", e);
    }
  };

  const totalModifierDisplay = (activeRoll?.modifier || 0) + tempModifier + experienceModifier;

  // Clear result bubble and allow for new rolls
  const clearResult = () => {
    setLastRollResult(null);
    setHasRolled(false);
  };

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 transition-opacity duration-300",
          isDiceOverlayOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ zIndex: Z_INDEX.DICE_OVERLAY }}
      >
        <div className={clsx(
          "absolute inset-0 bg-dagger-dark transition-opacity duration-300",
          isDiceOverlayOpen ? "opacity-100" : "opacity-0"
        )} />
        <div
          id="dice-tray-overlay"
          ref={containerRef}
          className="absolute inset-0 w-screen h-screen"
          style={{ 
            pointerEvents: isDiceOverlayOpen && !hasRolled ? 'auto' : 'none',
            zIndex: 1 // Relative to parent
          }}
          data-testid="dice-tray"
          data-ready={isReady}
        />
        {/* Hidden element for tests to detect ready state */}
        {isReady && <div data-testid="dice-ready" className="hidden" />}
      </div>

      <AnimatePresence>
        {isDiceOverlayOpen && (
          <div 
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: Z_INDEX.DICE_OVERLAY + 1 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              <motion.div
                className="absolute top-0 left-0 right-0 p-4 flex flex-col gap-4"
                style={{ zIndex: Z_INDEX.BASE + 1 }}
                animate={{
                  opacity: hasRolled ? 0 : 1,
                  pointerEvents: hasRolled ? 'none' : 'auto'
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="flex justify-between items-start pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDiceOverlay();
                    }}
                    className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors touch-auto pointer-events-auto cursor-pointer"
                    style={{ zIndex: Z_INDEX.MODAL }}
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>

                  {activeRoll && (
                    <div className="bg-black/75 px-4 py-2 rounded-full text-white font-medium text-sm border border-white/10 pointer-events-auto">
                      Rolling <span className="text-dagger-gold font-bold capitalize">{activeRoll.label}</span>
                      {activeRoll.dice && <span className="text-gray-400 ml-2 text-xs">({activeRoll.dice})</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 pointer-events-auto" data-testid="dice-controls">
                  <div className="flex items-center gap-2 bg-black/75 p-1 rounded-full border border-white/10" data-testid="modifier-control">
                    <span className="text-xs text-gray-300 pl-3 font-bold uppercase">Mod</span>
                    <button onClick={() => setTempModifier(m => m - 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20" data-testid="modifier-decrease" aria-label="Decrease modifier">-</button>
                    <span className="w-8 text-center font-mono font-bold" data-testid="modifier-value">{totalModifierDisplay >= 0 ? `+${totalModifierDisplay}` : totalModifierDisplay}</span>
                    <button onClick={() => setTempModifier(m => m + 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20" data-testid="modifier-increase" aria-label="Increase modifier">+</button>
                  </div>

                  {/* DICE BUILDER UI */}
                  <div className="flex flex-col gap-2 mt-2 w-full max-w-md">

                    {/* Pool Display */}
                    <div className="flex flex-wrap justify-center gap-2 bg-black/75 p-2 rounded-xl border border-white/10 min-h-[4rem]" data-testid="dice-pool">
                      {dicePool.map((die) => (
                        <div key={die.id} className="relative group" data-testid={`die-chip-${die.id}`}>
                          <button
                            onClick={() => cycleRole(die.id)}
                            className={clsx(
                              "flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors border",
                              die.role === 'hope' ? "bg-dagger-gold/20 border-dagger-gold" :
                                die.role === 'fear' ? "bg-purple-900/40 border-purple-500" :
                                  die.role === 'plus' ? "bg-white/20 border-white" :
                                    die.role === 'minus' ? "bg-gray-800/40 border-gray-400" :
                                      die.role === 'damage' ? "bg-dice-damage/20 border-dice-damage" :
                                        "bg-green-900/40 border-green-500"
                            )}
                            data-testid={`die-button-${die.role}-d${die.sides}`}
                            data-die-role={die.role}
                            data-die-sides={die.sides}
                            aria-label={`Cycle role for d${die.sides} (currently ${die.role})`}
                          >
                            <span className={clsx("text-[8px] font-bold uppercase",
                              die.role === 'hope' ? "text-dagger-gold" :
                                die.role === 'fear' ? "text-purple-400" :
                                  die.role === 'plus' ? "text-white" :
                                    die.role === 'minus' ? "text-gray-300" :
                                      die.role === 'damage' ? "text-red-400" :
                                        "text-green-400"
                            )}>{die.role}</span>
                            <span className="text-lg font-black text-white">d{die.sides}</span>
                          </button>
                          <button
                            onClick={() => removeDie(die.id)}
                            className="absolute -top-3 -right-3 bg-red-500/50 text-white rounded-full p-1 shadow-md opacity-50 group-hover:opacity-100 transition-opacity"
                            data-testid={`die-remove-${die.id}`}
                            aria-label={`Remove ${die.role} d${die.sides}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Dice Picker */}
                    <div className="flex justify-center gap-2 bg-black/75 p-2 rounded-xl border border-white/10" data-testid="dice-picker">
                      {[4, 6, 8, 10, 12, 20].map(sides => (
                        <button
                          key={sides}
                          onClick={() => addDie(sides)}
                          className="w-10 h-10 flex flex-col items-center justify-center bg-white/5 hover:bg-white/15 rounded border border-white/5 hover:border-white/20 transition-all"
                          data-testid={`add-d${sides}`}
                          aria-label={`Add d${sides}`}
                        >
                          <span className="text-xs font-bold text-gray-400">d{sides}</span>
                          <Plus size={12} className="text-white" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experiences & Hope Section */}
                  {experiences.length > 0 && !activeRoll?.dice && (
                    <div className="flex flex-col items-center gap-2 w-full max-w-md px-4 mt-2" data-testid="experiences-section">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <span className="text-dagger-gold" data-testid="current-hope">Hope: {currentHope}</span>
                        {hopeCost > 0 && (
                          <span className="text-red-400 animate-pulse">- {hopeCost}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2" data-testid="experiences-list">
                        {experiences.map((exp, idx) => {
                          const isSelected = selectedExpIndices.includes(idx);
                          const canAfford = currentHope - hopeCost >= 1;
                          const isCompanionExp = exp.source === 'companion';
                          return (
                            <button
                              key={idx}
                              onClick={() => toggleExperience(idx)}
                              disabled={!isSelected && !canAfford}
                              className={clsx(
                                "px-3 py-1 rounded-full text-sm font-bold border transition-all flex items-center gap-1",
                                isSelected
                                  ? "bg-dagger-gold/75 text-black border-dagger-gold shadow-md shadow-dagger-gold/20"
                                  : canAfford
                                    ? "bg-black/75 text-gray-300 border-white/20 hover:bg-white/10"
                                    : "bg-black/50 text-gray-600 border-white/5 opacity-50 cursor-not-allowed"
                              )}
                              data-testid={`experience-${idx}`}
                              data-selected={isSelected}
                              aria-label={`Toggle ${exp.name} experience (+${exp.value})`}
                            >
                              {isCompanionExp && <span className="text-xs opacity-70">🐾</span>}
                              {exp.name} <span className="opacity-80">+{exp.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleRoll()}
                    className="mt-2 px-8 py-3 bg-dagger-gold/75 text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-lg cursor-pointer pointer-events-auto"
                    data-testid="roll-button"
                  >
                    <RotateCcw size={20} />
                    ROLL
                  </button>
                </div>
              </motion.div>

              {/* Tap-to-close backdrop when showing results */}
              {hasRolled && (
                <div
                  className="absolute inset-0 pointer-events-auto touch-auto"
                  style={{ zIndex: Z_INDEX.BASE + 1 }}
                  onClick={closeDiceOverlay}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    closeDiceOverlay();
                  }}
                />
              )}

              {lastRollResult && lastRollResult.total > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-auto"
                  style={{ zIndex: Z_INDEX.CARD_CONTENT }}
                  data-testid="roll-result"
                >
                  <div
                    className="bg-dagger-panel/75 border border-white/10 p-6 rounded-2xl shadow-2xl text-center relative"
                    onClick={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={closeDiceOverlay}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        closeDiceOverlay();
                      }}
                      className="absolute top-3 right-3 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-colors touch-auto touch-manipulation pointer-events-auto cursor-pointer"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>

                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Result</div>
                    <div className="text-6xl font-serif font-black text-white mb-4" data-testid="roll-total">{lastRollResult.total}</div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
                      {lastRollResult.dice?.map((die, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <span className={clsx(
                            "text-[10px] uppercase font-bold",
                            die.role === 'hope' ? "text-dagger-gold" :
                              die.role === 'fear' ? "text-purple-400" :
                                die.role === 'plus' ? "text-white" :
                                  die.role === 'minus' ? "text-gray-300" :
                                    die.role === 'damage' ? "text-red-400" :
                                      "text-green-400" // For 'extra'
                          )}>
                            {die.role}
                          </span>
                          <span className="text-2xl font-bold text-white">{die.value}</span>
                        </div>
                      ))}
                      {lastRollResult.modifier !== 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Mod</span>
                          <span className="text-2xl font-bold text-white">{lastRollResult.modifier >= 0 ? `+${lastRollResult.modifier}` : lastRollResult.modifier}</span>
                        </div>
                      )}
                    </div>
                    {lastRollResult.type !== 'Damage' && (
                      <div className={clsx(
                        "inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide",
                        lastRollResult.type === 'Critical' ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                          lastRollResult.type === 'Hope' ? "bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/50" :
                            lastRollResult.type === 'Fear' ? "bg-purple-500/20 text-purple-300 border border-purple-500/50" :
                              "bg-white/10 text-white border border-white/20"
                      )}
                        data-testid="roll-type"
                        data-roll-type={lastRollResult.type}
                      >
                        {lastRollResult.type === 'Critical' ? 'Critical Success!' : `With ${lastRollResult.type}`}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
