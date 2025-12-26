'use client';

/**
 * PRAYER DICE CARD COMPONENT
 * ----------------------------------------------------------------------------
 * A card interface for managing Seraph Prayer Dice.
 *
 * FUNCTIONALITY:
 * - Roll d4s equal to Spellcast trait (Strength for Seraph)
 * - Display each die result in a row with use/restore toggle
 * - Track which dice have been used
 * - Special handling for Divine Wielder "Devout" feature (roll +1, discard lowest)
 * - Clear all dice at session end
 */

import React, { useState } from 'react';
import { Sparkles, Dices, Info, RotateCcw, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import { SeraphPrayerDice, PrayerDie } from '@/types/character';
import { toast } from 'sonner';

interface PrayerDiceCardProps {
  prayerDice: SeraphPrayerDice | undefined;
  spellcastValue: number; // The character's Spellcast trait value (e.g., Strength)
  hasDevout: boolean; // Divine Wielder specialization feature
  onUpdatePrayerDice: (dice: SeraphPrayerDice) => void;
}

export default function PrayerDiceCard({
  prayerDice,
  spellcastValue,
  hasDevout,
  onUpdatePrayerDice,
}: PrayerDiceCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Roll prayer dice
  const handleRoll = () => {
    const diceCount = spellcastValue;
    const rollCount = hasDevout ? diceCount + 1 : diceCount; // Devout: roll +1 die

    const rolls: number[] = [];
    for (let i = 0; i < rollCount; i++) {
      rolls.push(Math.floor(Math.random() * 4) + 1); // d4: 1-4
    }

    let finalRolls = rolls;
    let discardedValue: number | null = null;

    // If Devout, discard the lowest
    if (hasDevout && rollCount > diceCount) {
      const minValue = Math.min(...rolls);
      const minIndex = rolls.indexOf(minValue);
      discardedValue = minValue;
      finalRolls = rolls.filter((_, idx) => idx !== minIndex);
    }

    // Create dice objects
    const dice: PrayerDie[] = finalRolls.map((value, idx) => ({
      id: `${Date.now()}-${idx}`,
      value,
      used: false,
    }));

    const newPrayerDice: SeraphPrayerDice = {
      dice,
      lastRolled: new Date().toISOString(),
    };

    onUpdatePrayerDice(newPrayerDice);

    if (hasDevout && discardedValue !== null) {
      toast.success(`Rolled ${rollCount}d4, discarded lowest (${discardedValue})`);
    } else {
      toast.success(`Rolled ${diceCount} prayer dice`);
    }
  };

  // Toggle die used state
  const toggleDieUsed = (dieId: string) => {
    if (!prayerDice) return;

    const updatedDice = prayerDice.dice.map(die =>
      die.id === dieId ? { ...die, used: !die.used } : die
    );

    onUpdatePrayerDice({
      ...prayerDice,
      dice: updatedDice,
    });
  };

  // Clear all dice
  const handleClearAll = () => {
    if (confirm('Clear all prayer dice? This should be done at the end of each session.')) {
      onUpdatePrayerDice({
        dice: [],
        lastRolled: undefined,
      });
      toast.success('Prayer dice cleared');
    }
  };

  const hasDice = prayerDice && prayerDice.dice.length > 0;
  const availableDice = prayerDice?.dice.filter(d => !d.used) || [];
  const usedDice = prayerDice?.dice.filter(d => d.used) || [];

  return (
    <div className="bg-dagger-panel border border-dagger-gold/30 rounded-xl p-4 relative overflow-hidden">
      {/* Gold left border accent (matches Hope Feature) */}
      <div className="absolute top-0 left-0 w-1 h-full bg-dagger-gold"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-serif font-bold text-dagger-gold flex items-center gap-2">
          <Sparkles size={14} />
          Prayer Dice
        </h4>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Info size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Info Section (Collapsible) */}
      {showInfo && (
        <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
          <p className="text-xs text-gray-400 mb-2">
            At the beginning of each session, roll a number of d4s equal to your Spellcast trait.
            You can spend any number of Prayer Dice to aid yourself or an ally within Far range.
          </p>
          <p className="text-xs font-bold text-white mb-1">Uses:</p>
          <ul className="space-y-0.5 text-xs text-gray-400 ml-4">
            <li>• Reduce incoming damage by die value</li>
            <li>• Add die value to a roll (after rolling)</li>
            <li>• Gain Hope equal to die value</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ Clear all dice at the end of each session
          </p>
        </div>
      )}

      {/* Roll Button Section */}
      {!hasDice && (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            Roll prayer dice at the start of each session.
          </p>
          <button
            onClick={handleRoll}
            className="w-full py-2.5 bg-dagger-gold/10 hover:bg-dagger-gold/20 border border-dagger-gold/30 text-dagger-gold font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Dices size={16} />
            Roll {spellcastValue} Prayer Dice (d4)
            {hasDevout && <span className="text-xs opacity-75">+1 Devout</span>}
          </button>
        </div>
      )}

      {/* Dice Display Section */}
      {hasDice && (
        <div className="space-y-3">
          {/* Available Dice */}
          {availableDice.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                Available ({availableDice.length})
              </div>
              <div className="space-y-2">
                {availableDice.map((die) => (
                  <div
                    key={die.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3 transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <Circle size={14} className="text-gray-500" />
                      <span className="text-base font-bold text-white">
                        Value: {die.value}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleDieUsed(die.id)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded transition-colors"
                    >
                      Mark as Used
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Used Dice */}
          {usedDice.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                Used ({usedDice.length})
              </div>
              <div className="space-y-2">
                {usedDice.map((die) => (
                  <div
                    key={die.id}
                    className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3 opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-base font-bold text-gray-500">
                        Value: {die.value}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleDieUsed(die.id)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold rounded transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary & Actions */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Available: {availableDice.length} | Used: {usedDice.length}
            </div>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded transition-colors"
            >
              <RotateCcw size={12} />
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
