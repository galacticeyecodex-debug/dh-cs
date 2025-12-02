'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Shield, Swords, Zap, Skull, Info, Heart, Eye } from 'lucide-react';
import clsx from 'clsx';
import { parseDamageRoll, calculateBaseEvasion } from '@/lib/utils';
import VitalCard from '@/components/vital-card'; // Import common VitalCard

export default function CombatView() {
  const { character, prepareRoll, updateVitals, updateHope, updateEvasion } = useCharacterStore();

  if (!character) return null;

  const expectedEvasion = calculateBaseEvasion(character);
  const isEvasionModified = character.evasion !== expectedEvasion;

  // Find equipped items
  const weapons = character.character_inventory?.filter(
    item => item.location === 'equipped_primary' || item.location === 'equipped_secondary'
  ) || [];
  
  const armor = character.character_inventory?.find(item => item.location === 'equipped_armor');

  // Calculate damage thresholds for armor, considering character level
  let minorThreshold = 1;
  let majorThreshold = character.level;
  let severeThreshold = character.level * 2;

  if (armor?.library_item?.data?.base_thresholds) {
    const [baseMajor, baseSevere] = armor.library_item.data.base_thresholds.split('/').map((s: string) => parseInt(s.trim()));
    // According to SRD: "A PC’s damage thresholds are calculated by adding their level to the listed damage thresholds of their equipped armor."
    // However, the base Thresholds already seem to account for level tier (Tier 1 vs Tier 2 armor has higher thresholds)
    // For simplicity, let's assume base_thresholds directly reflect the Major/Severe values for the equipped armor, and Minor is always 1.
    
    // Default Minor is 1 HP. Major is baseMajor. Severe is baseSevere.
    // Daggerheart Rule: "If the final damage is below the character’s Major damage threshold, they mark 1 HP."
    majorThreshold = baseMajor;
    severeThreshold = baseSevere;
  }
  
  // Find Class Data for features
  // We assume the class data is loaded or we might need to fetch it if not fully populated in character store
  // For now, we might need to rely on what we have. 
  // *Correction*: The `character` object in store currently has `class_id` (string). 
  // We might need to fetch the Class Library Item to get the features text if it's not stored on the character.
  // The current store `fetchCharacter` stitches `library_item` for cards/inventory, but NOT for the class itself yet.
  
  // TODO: We need to fetch Class Library Data to display Class Features. 
  // For this iteration, we will focus on Vitals and Weapons.

  return (
    <div className="space-y-6 pb-24">
      {/* Vitals & Evasion Grid - Reshaped for Mobile */}
      <div className="space-y-3">
        {/* Row 1: Evasion & Armor (Squares) */}
        <div className="grid grid-cols-2 gap-3">
          <VitalCard 
            label="Evasion" 
            current={character.evasion} 
            color={isEvasionModified ? "text-yellow-400" : "text-cyan-400"}
            icon={Eye} 
            onIncrement={() => updateEvasion(character.evasion + 1)}
            onDecrement={() => updateEvasion(character.evasion - 1)}
            isModified={isEvasionModified}
            expectedValue={expectedEvasion}
          />
          <VitalCard 
            label="Armor" 
            current={character.vitals.armor_current} 
            max={character.vitals.armor_max}
            color="text-blue-400"
            icon={Shield}
            onIncrement={() => updateVitals('armor_current', character.vitals.armor_current + 1)}
            onDecrement={() => updateVitals('armor_current', character.vitals.armor_current - 1)}
            isCriticalCondition={character.vitals.armor_current === 0 && character.vitals.armor_max > 0} // Only critical if we have armor slots and they are 0
            thresholds={{ minor: minorThreshold, major: majorThreshold, severe: severeThreshold }}
            trackType="mark-bad"
            disableCritColor={true}
          />
        </div>

        {/* Row 2: Hit Points (Rectangle) */}
        <VitalCard 
          label="Hit Points" 
          current={character.vitals.hp_current} 
          max={character.vitals.hp_max}
          color="text-red-400"
          icon={Heart}
          variant="rectangle"
          onIncrement={() => updateVitals('hp_current', character.vitals.hp_current + 1)}
          onDecrement={() => updateVitals('hp_current', character.vitals.hp_current - 1)}
          isCriticalCondition={character.vitals.hp_current === 0}
          trackType="mark-bad"
        />

        {/* Row 3: Stress (Rectangle) */}
        <VitalCard
          label="Stress"
          current={character.vitals.stress_current}
          max={character.vitals.stress_max}
          color="text-purple-400"
          icon={Zap}
          variant="rectangle"
          onIncrement={() => updateVitals('stress_current', character.vitals.stress_current + 1)}
          onDecrement={() => updateVitals('stress_current', character.vitals.stress_current - 1)}
          isCriticalCondition={character.vitals.stress_current === character.vitals.stress_max}
          trackType="fill-up-bad"
        />

        {/* Row 4: Hope (Rectangle) */}
        <VitalCard 
          label="Hope" 
          current={character.hope} 
          max={6} 
          color="text-dagger-gold"
          icon={Zap}
          variant="rectangle"
          onIncrement={() => updateHope(character.hope + 1)}
          onDecrement={() => updateHope(character.hope - 1)}
          trackType="fill-up-good"
        />
      </div>
      
      {/* Weapons List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
          <Swords size={16} /> Active Weapons
        </h3>
        
        {weapons.length > 0 ? (
          weapons.map((weapon) => {
            const libData = weapon.library_item?.data;
            const trait = libData?.trait || 'Strength';
            const damage = libData?.damage || '1d8';
            const range = libData?.range || 'Melee';
            const traitValue = character.stats[trait.toLowerCase() as keyof typeof character.stats] || 0;

            return (
              <div key={weapon.id} className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden group">
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h4 className="font-serif font-bold text-white text-lg">{weapon.name}</h4>
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                      <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{trait}</span>
                      <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{range}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-dagger-gold">{damage}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Damage</div>
                  </div>
                </div>
                
                {/* Action Bar */}
                <div className="bg-black/40 p-2 flex gap-2">
                  <button 
                    onClick={() => prepareRoll(`${weapon.name} Attack`, traitValue)}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap size={16} className="text-yellow-400" /> Attack ({traitValue >= 0 ? `+${traitValue}` : traitValue})
                  </button>
                  <button 
                    onClick={() => {
                      const { dice, modifier } = parseDamageRoll(damage);
                      prepareRoll(`${weapon.name} Damage`, modifier, dice);
                    }}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Skull size={16} className="text-red-400" /> Damage
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center py-4 italic">No active weapons equipped.</div>
        )}
      </div>

      {/* Active Armor */}
      {armor && (
        <div className="space-y-2">
           <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Shield size={16} /> Active Armor
          </h3>
          <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            <h4 className="font-serif font-bold text-white mb-1">{armor.name}</h4>
            {armor.library_item?.data && (
              <div className="text-xs text-gray-400 mt-1">
                {armor.library_item.data.feature?.name && (
                  <p className="italic"><span className="font-bold not-italic text-gray-300">{armor.library_item.data.feature.name}:</span> {armor.library_item.data.feature.text}</p>
                )}
                <p className="mt-1">Score: {armor.library_item.data.base_score}, Thresholds: {armor.library_item.data.base_thresholds}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Class Features */}
      {character.class_data && (
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Info size={16} /> Class Features
          </h3>
          
          {/* Hope Feature */}
          {character.class_data.data.hope_feature && (
             <div className="bg-dagger-panel border border-dagger-gold/30 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-dagger-gold"></div>
                <h4 className="font-serif font-bold text-dagger-gold mb-1 flex items-center gap-2">
                  <Zap size={14} />
                  {character.class_data.data.hope_feature.name}
                </h4>
                <p className="text-sm text-gray-300">{character.class_data.data.hope_feature.description}</p>
             </div>
          )}

          {/* Core Class Features */}
          {character.class_data.data.class_features?.map((feature: any, idx: number) => (
            <div key={idx} className="bg-dagger-panel border border-white/10 rounded-xl p-4">
              <h4 className="font-serif font-bold text-white mb-1">{feature.name}</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{feature.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

