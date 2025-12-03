'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

export default function DiceOverlay() {
  const { isDiceOverlayOpen, closeDiceOverlay, setLastRollResult, lastRollResult, activeRoll } = useCharacterStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const boxInstanceRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [tempModifier, setTempModifier] = useState(0);
  const diceBoxClassRef = useRef<any>(null);
  const [moduleLoaded, setModuleLoaded] = useState(false);

  // Reset temp modifier when overlay opens
  useEffect(() => {
    if (isDiceOverlayOpen) {
      setTempModifier(0);
    }
  }, [isDiceOverlayOpen]);

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

  // Initialize DiceBox - run once when module is loaded and container is available
  useEffect(() => {
    if (!containerRef.current || boxInstanceRef.current || !moduleLoaded || !diceBoxClassRef.current) return;

    const DiceBox = diceBoxClassRef.current;
    const box = new DiceBox({
      container: "#dice-tray-overlay",
      assetPath: '/assets/',
      scale: 6,
      theme: 'default',
      offscreen: true,
      gravity_multiplier: 400,
      light_intensity: 0.8,
      enable_shadows: true,
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
        // Do NOT destroy the box on unmount if we want to reuse it, 
        // but since this component might be conditionally rendered by a parent,
        // we might need to keep it mounted.
        // Current Plan: This component is mounted once in the layout? 
        // If so, we just keep the box alive.
    };
  }, [moduleLoaded]); // Removed isDiceOverlayOpen dependency


  // Trigger resize when overlay opens to ensure physics bounds are correct
  useEffect(() => {
    if (isDiceOverlayOpen && boxInstanceRef.current && isReady) {
      // Small timeout to ensure layout is stable if transition affects it (though opacity shouldn't)
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

    const baseModifier = activeRoll?.modifier || 0;
    const totalModifier = baseModifier + tempModifier;
    
    boxInstanceRef.current.clear();

    // Case 1: Custom Dice Roll (e.g. Damage)
    if (activeRoll?.dice) {
       setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: totalModifier, type: 'Damage' });
       
       try {
         // Parse dice string (e.g., "1d8", "d8 phy", "d10+3")
         // Clean string: remove "phy", "mag" (case insensitive) and whitespace
         const cleanDice = activeRoll.dice.replace(/(phy|mag|physical|magic)/gi, '').replace(/\s/g, '');
         
         const diceParts = cleanDice.split('+');
         const diceConfig = [];
         let stringModifier = 0;
         
         for (const part of diceParts) {
             // Match "d8", "1d8"
             const diceMatch = part.match(/^(\d+)?d(\d+)$/i);
             if (diceMatch) {
                 const count = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
                 const sides = parseInt(diceMatch[2]);
                 for (let i = 0; i < count; i++) {
                     diceConfig.push({ sides, themeColor: '#ef4444' }); // Red for damage
                 }
             } else {
                 // Check for static number
                 const num = parseInt(part);
                 if (!isNaN(num)) {
                     stringModifier += num;
                 }
             }
         }
         
         if (diceConfig.length === 0) {
             // If only a modifier was found or parsing failed?
             if (stringModifier > 0) {
                 // Just a flat damage number
                 setLastRollResult({
                     hope: 0, 
                     fear: 0,
                     total: stringModifier + totalModifier,
                     modifier: totalModifier + stringModifier,
                     type: 'Damage'
                 });
                 return;
             }
             
             console.warn("Could not parse dice string:", activeRoll.dice);
             return;
         }

         const result = await boxInstanceRef.current.roll(diceConfig);
         
         // Sum up results
         let diceTotal = 0;
         if (Array.isArray(result)) {
             diceTotal = result.reduce((acc: number, die: any) => acc + die.value, 0);
         }
         
         const finalTotalModifier = totalModifier + stringModifier;

         setLastRollResult({
             hope: 0, 
             fear: 0,
             total: diceTotal + finalTotalModifier,
             modifier: finalTotalModifier,
             type: 'Damage'
         });

       } catch (e) {
           console.error("Custom roll failed", e);
       }
       
       return;
    }

    // Case 2: Standard Duality Roll
    setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: totalModifier, type: 'Hope' }); 

    try {
      const result = await boxInstanceRef.current.roll([
        { sides: 12, themeColor: '#f6c928' }, // Hope (Gold)
        { sides: 12, themeColor: '#4a148c' }  // Fear (Purple)
      ]);

      if (Array.isArray(result) && result.length === 2) {
        const hopeRoll = result[0].value;
        const fearRoll = result[1].value;
        const total = hopeRoll + fearRoll + totalModifier;
        
        let type: 'Critical' | 'Hope' | 'Fear' | 'Damage' = 'Hope';
        if (hopeRoll === fearRoll) type = 'Critical';
        else if (hopeRoll > fearRoll) type = 'Hope';
        else type = 'Fear';

        setLastRollResult({
          hope: hopeRoll,
          fear: fearRoll,
          total,
          modifier: totalModifier,
          type
        });
      }
    } catch (e) {
      console.error("Roll failed", e);
    }
  };

  const totalModifierDisplay = (activeRoll?.modifier || 0) + tempModifier;

  return (
    <>
      {/* Persistent Container for DiceBox - Always rendered but hidden when inactive */}
      <div 
        className={clsx(
          "fixed inset-0 z-40 transition-opacity duration-300",
          isDiceOverlayOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
         {/* Background Backdrop (only visible when open) */}
        <div className={clsx(
            "absolute inset-0 bg-black/60 transition-opacity duration-300",
            isDiceOverlayOpen ? "opacity-100" : "opacity-0"
        )} />

        {/* 3D Canvas Container */}
        <div id="dice-tray-overlay" ref={containerRef} className="absolute inset-0 w-screen h-screen cursor-pointer z-10" onClick={() => isDiceOverlayOpen && handleRoll()} />
      </div>

      {/* UI Controls - Conditionally rendered for clean DOM but separated from Canvas */}
      <AnimatePresence>
        {isDiceOverlayOpen && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
                        {/* Header / Controls */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex flex-col gap-4 z-20 pointer-events-none">
                          <div className="flex justify-between items-start pointer-events-auto">
                            <button 
                              onClick={closeDiceOverlay}
                              className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
                            >
                              <X size={24} />
                            </button>
                            
                            {/* Context Display */}
                            {activeRoll && (
                               <div className="bg-black/40 px-4 py-2 rounded-full text-white font-medium text-sm border border-white/10">
                                  Rolling <span className="text-dagger-gold font-bold capitalize">{activeRoll.label}</span>
                                  {activeRoll.dice && <span className="text-gray-400 ml-2 text-xs">({activeRoll.dice})</span>}
                               </div>
                            )}
                          </div>
              
                           {/* Roll Controls */}
                           <div className="flex flex-col items-center gap-2 pointer-events-auto">
                              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-full border border-white/10">                        <span className="text-xs text-gray-300 pl-3 font-bold uppercase">Mod</span>
                        <button onClick={() => setTempModifier(m => m - 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20">-</button>
                        <span className="w-8 text-center font-mono font-bold">{totalModifierDisplay >= 0 ? `+${totalModifierDisplay}` : totalModifierDisplay}</span>
                        <button onClick={() => setTempModifier(m => m + 1)} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20">+</button>
                    </div>

                    <button 
                      onClick={() => handleRoll()}
                      className="px-8 py-3 bg-dagger-gold text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-lg"
                    >
                      <RotateCcw size={20} />
                      ROLL
                    </button>
                 </div>
              </div>

              {/* Result Display (Floating) */}
              {lastRollResult && lastRollResult.total > 0 && (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-none"
                >
                  <div className="bg-dagger-panel border border-white/10 p-6 rounded-2xl shadow-2xl text-center">
                    <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Result</div>
                    <div className="text-6xl font-serif font-black text-white mb-4">{lastRollResult.total}</div>
                    
                    {lastRollResult.type !== 'Damage' && (
                        <div className="flex justify-center gap-8 mb-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-dagger-gold uppercase font-bold">Hope</span>
                            <span className="text-2xl font-bold text-white">{lastRollResult.hope}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-purple-400 uppercase font-bold">Fear</span>
                            <span className="text-2xl font-bold text-white">{lastRollResult.fear}</span>
                        </div>
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