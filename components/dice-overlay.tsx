'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

type DiceRole = 'hope' | 'fear' | 'extra';

interface DieConfig {
  id: string;
  sides: number;
  role: DiceRole;
}

export default function DiceOverlay() {
  const { isDiceOverlayOpen, closeDiceOverlay, setLastRollResult, lastRollResult, activeRoll, character, updateHope } = useCharacterStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const boxInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [tempModifier, setTempModifier] = useState(0);
  const [selectedExpIndices, setSelectedExpIndices] = useState<number[]>([]);

  // BUILDER STATE
  const [dicePool, setDicePool] = useState<DieConfig[]>([]);

  const diceBoxClassRef = useRef<any>(null);
  const [moduleLoaded, setModuleLoaded] = useState(false);

  // Reset state when overlay opens
  useEffect(() => {
    if (isDiceOverlayOpen) {
      setTempModifier(0);
      setSelectedExpIndices([]);
      // Default Pool: 1 Hope (d12), 1 Fear (d12)
      setDicePool([
        { id: 'default-hope', sides: 12, role: 'hope' },
        { id: 'default-fear', sides: 12, role: 'fear' }
      ]);
    }
  }, [isDiceOverlayOpen]);

  // Calculate Experience Modifiers
  const experiences = character?.experiences || [];
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
    setDicePool(prev => [...prev, { id: crypto.randomUUID(), sides, role: 'extra' }]);
  };

  const removeDie = (id: string) => {
    setDicePool(prev => prev.filter(d => d.id !== id));
  };

  const cycleRole = (id: string) => {
    setDicePool(prev => prev.map(d => {
      if (d.id !== id) return d;
      const roles: DiceRole[] = ['extra', 'hope', 'fear'];
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
      return;
    }

    if (hopeCost > 0) {
      await updateHope(currentHope - hopeCost);
    }

    const baseModifier = activeRoll?.modifier || 0;
    const totalModifier = baseModifier + tempModifier + experienceModifier;

    boxInstanceRef.current.clear();

    // Case 1: Custom Dice Roll (Damage)
    if (activeRoll?.dice) {
      setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: totalModifier, type: 'Damage' });
      try {
        const cleanDice = activeRoll.dice.replace(/(phy|mag|physical|magic)/gi, '').replace(/\s/g, '');
        const diceParts = cleanDice.split('+');
        const diceConfig = [];
        let stringModifier = 0;
        for (const part of diceParts) {
          const diceMatch = part.match(/^(\d+)?d(\d+)$/i);
          if (diceMatch) {
            const count = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
            const sides = parseInt(diceMatch[2]);
            for (let i = 0; i < count; i++) {
              diceConfig.push({ sides, themeColor: '#ef4444' });
            }
          } else {
            const num = parseInt(part);
            if (!isNaN(num)) stringModifier += num;
          }
        }
        if (diceConfig.length === 0) {
          if (stringModifier > 0) {
            setLastRollResult({ hope: 0, fear: 0, total: stringModifier + totalModifier, modifier: totalModifier + stringModifier, type: 'Damage' });
            return;
          }
          return;
        }
        const result = await boxInstanceRef.current.roll(diceConfig);
        let diceTotal = 0;
        if (Array.isArray(result)) diceTotal = result.reduce((acc: number, die: any) => acc + die.value, 0);
        const finalTotalModifier = totalModifier + stringModifier;
        setLastRollResult({ hope: 0, fear: 0, total: diceTotal + finalTotalModifier, modifier: finalTotalModifier, type: 'Damage' });
      } catch (e) { console.error("Custom roll failed", e); }
      return;
    }

    // Case 2: Builder Duality Roll
    setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: totalModifier, type: 'Hope' });

    try {
      const diceConfig = dicePool.map(d => ({
        sides: d.sides,
        themeColor: d.role === 'hope' ? '#f6c928' : d.role === 'fear' ? '#4a148c' : '#22c55e'
      }));

      console.log("Rolling Duality Config", diceConfig);

      if (diceConfig.length === 0) {
        console.warn("No dice in pool");
        return;
      }

      const result = await boxInstanceRef.current.roll(diceConfig);

      if (Array.isArray(result)) {
        // Identify primary Hope and Fear rolls
        // If multiple exist, we might need rules (highest? first?). For now, take first.
        // We rely on the order in dicePool matching result order (usually true for DiceBox).

        let hopeRoll = 0;
        let fearRoll = 0;
        let extraTotal = 0;
        const individualDieResults: { role: DiceRole, value: number, sides: number }[] = [];

        dicePool.forEach((die, idx) => {
          const val = result[idx].value;
          individualDieResults.push({ role: die.role, value: val, sides: die.sides });

          if (die.role === 'hope' && hopeRoll === 0) hopeRoll = val;
          else if (die.role === 'fear' && fearRoll === 0) fearRoll = val;
          else extraTotal += val;
        });
          
        const total = hopeRoll + fearRoll + totalModifier + extraTotal;
        
        console.log("Roll Calculation:", { hopeRoll, fearRoll, extraTotal, total, totalModifier, individualDieResults });
        
        let type: 'Critical' | 'Hope' | 'Fear' | 'Damage' = 'Hope';
        if (hopeRoll === fearRoll && hopeRoll !== 0) type = 'Critical';
        else if (hopeRoll > fearRoll) type = 'Hope';
        else type = 'Fear';

        setLastRollResult({
          hope: hopeRoll,
          fear: fearRoll,
          total,
          extras: extraTotal,
          modifier: totalModifier,
          type,
          dice: individualDieResults
        });
      }
    } catch (e) {
      console.error("Roll failed", e);
    }
  };

  const totalModifierDisplay = (activeRoll?.modifier || 0) + tempModifier + experienceModifier;

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 transition-opacity duration-300",
          isDiceOverlayOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className={clsx(
          "absolute inset-0 bg-dagger-dark transition-opacity duration-300",
          isDiceOverlayOpen ? "opacity-100" : "opacity-0"
        )} />
        <div id="dice-tray-overlay" ref={containerRef} className="absolute inset-0 w-screen h-screen cursor-pointer z-10" onClick={() => isDiceOverlayOpen && handleRoll()} />
      </div>

      <AnimatePresence>
        {isDiceOverlayOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              <div className="absolute top-0 left-0 right-0 p-4 flex flex-col gap-4 z-20 pointer-events-none">
                <div className="flex justify-between items-start pointer-events-auto">
                  <button
                    onClick={closeDiceOverlay}
                    className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
                  >
                    <X size={24} />
                  </button>

                  {activeRoll && (
                    <div className="bg-black/75 px-4 py-2 rounded-full text-white font-medium text-sm border border-white/10">
                      Rolling <span className="text-dagger-gold font-bold capitalize">{activeRoll.label}</span>
                      {activeRoll.dice && <span className="text-gray-400 ml-2 text-xs">({activeRoll.dice})</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 pointer-events-auto">
                  <div className="flex items-center gap-2 bg-black/75 p-1 rounded-full border border-white/10">
                    <span className="text-xs text-gray-300 pl-3 font-bold uppercase">Mod</span>
                    <button onClick={() => setTempModifier(m => m - 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20">-</button>
                    <span className="w-8 text-center font-mono font-bold">{totalModifierDisplay >= 0 ? `+${totalModifierDisplay}` : totalModifierDisplay}</span>
                    <button onClick={() => setTempModifier(m => m + 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20">+</button>
                  </div>

                  {/* PLAN C: DICE BUILDER UI */}
                  {!activeRoll?.dice && (
                    <div className="flex flex-col gap-2 mt-2 w-full max-w-md">

                      {/* Pool Display */}
                      <div className="flex flex-wrap justify-center gap-2 bg-black/75 p-2 rounded-xl border border-white/10 min-h-[4rem]">
                        {dicePool.map((die) => (
                          <div key={die.id} className="relative group">
                            <button
                              onClick={() => cycleRole(die.id)}
                              className={clsx(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors border",
                                die.role === 'hope' ? "bg-dagger-gold/20 border-dagger-gold" :
                                  die.role === 'fear' ? "bg-purple-900/40 border-purple-500" :
                                    "bg-green-900/40 border-green-500"
                              )}
                            >
                              <span className={clsx("text-[8px] font-bold uppercase",
                                die.role === 'hope' ? "text-dagger-gold" :
                                  die.role === 'fear' ? "text-purple-400" :
                                    "text-green-400"
                              )}>{die.role}</span>
                              <span className="text-lg font-black text-white">d{die.sides}</span>
                            </button>
                            <button
                              onClick={() => removeDie(die.id)}
                              className="absolute -top-3 -right-3 bg-red-500/50 text-white rounded-full p-1 shadow-md opacity-50 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Dice Picker */}
                      <div className="flex justify-center gap-2 bg-black/75 p-2 rounded-xl border border-white/10">
                        {[4, 6, 8, 10, 12, 20].map(sides => (
                          <button
                            key={sides}
                            onClick={() => addDie(sides)}
                            className="w-10 h-10 flex flex-col items-center justify-center bg-white/5 hover:bg-white/15 rounded border border-white/5 hover:border-white/20 transition-all"
                          >
                            <span className="text-xs font-bold text-gray-400">d{sides}</span>
                            <Plus size={12} className="text-white" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experiences & Hope Section */}
                  {experiences.length > 0 && !activeRoll?.dice && (
                    <div className="flex flex-col items-center gap-2 w-full max-w-md px-4 mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <span className="text-dagger-gold">Hope: {currentHope}</span>
                        {hopeCost > 0 && (
                          <span className="text-red-400 animate-pulse">- {hopeCost}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {experiences.map((exp, idx) => {
                          const isSelected = selectedExpIndices.includes(idx);
                          const canAfford = currentHope - hopeCost >= 1;
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
                            >
                              {exp.name} <span className="opacity-80">+{exp.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleRoll()}
                    className="mt-2 px-8 py-3 bg-dagger-gold/75 text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-lg"
                  >
                    <RotateCcw size={20} />
                    ROLL
                  </button>
                </div>
              </div>

              {lastRollResult && lastRollResult.total > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-none"
                >
                  <div className="bg-dagger-panel/75 border border-white/10 p-6 rounded-2xl shadow-2xl text-center">
                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Result</div>
                    <div className="text-6xl font-serif font-black text-white mb-4">{lastRollResult.total}</div>
                    {lastRollResult.type !== 'Damage' && (
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
                            {lastRollResult.dice?.map((die, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <span className={clsx(
                                        "text-[10px] uppercase font-bold",
                                        die.role === 'hope' ? "text-dagger-gold" :
                                        die.role === 'fear' ? "text-purple-400" :
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
                    )}
                    <div className={clsx(
                      "inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide",
                      lastRollResult.type === 'Critical' ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                        lastRollResult.type === 'Hope' ? "bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/50" :
                          lastRollResult.type === 'Fear' ? "bg-purple-500/20 text-purple-300 border border-purple-500/50" :
                            "bg-red-500/20 text-red-300 border border-red-500/50"
                    )}>
                      {lastRollResult.type === 'Damage' ? 'Damage' : `With ${lastRollResult.type}`}
                    </div>
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
