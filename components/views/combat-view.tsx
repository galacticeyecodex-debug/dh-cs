'use client';

import React, { useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Shield, Swords, Zap, Skull, Info, Crosshair, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { parseDamageRoll, calculateWeaponDamage, getSystemModifiers } from '@/lib/utils';
import CommonVitalsDisplay from '@/components/common-vitals-display'; // Import the new common component
import ModifierSheet from '@/components/modifier-sheet';

export default function CombatView() {
  const { character, prepareRoll, updateModifiers } = useCharacterStore();
  const [showProficiencyModifiers, setShowProficiencyModifiers] = useState(false);
  const [showVitals, setShowVitals] = useState(true);
  const [showWeapons, setShowWeapons] = useState(true);
  const [showArmor, setShowArmor] = useState(true);
  const [showClassFeatures, setShowClassFeatures] = useState(true);

  if (!character) return null;

  // Find equipped items
  const weapons = character.character_inventory?.filter(
    item => item.location === 'equipped_primary' || item.location === 'equipped_secondary'
  ) || [];

  const armor = character.character_inventory?.find(item => item.location === 'equipped_armor');

  // Calculate Proficiency with Modifiers
  const baseProficiency = character.proficiency || 1;
  const systemProfMods = getSystemModifiers(character, 'proficiency');
  const userProfMods = character.modifiers?.['proficiency'] || [];
  const allProfMods = [...systemProfMods, ...userProfMods];

  const totalProficiency = Math.max(1, baseProficiency + allProfMods.reduce((acc, mod) => acc + mod.value, 0));
  const isProficiencyModified = totalProficiency !== baseProficiency;

  return (
    <div className="space-y-6 pb-24">
      {/* Vitals Toggle & Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Vitals</h3>
          <button
            onClick={() => setShowVitals(!showVitals)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
          >
            {showVitals ? <EyeOff size={14} /> : <Eye size={14} />}
            {showVitals ? 'Hide' : 'Show'}
          </button>
        </div>
        {showVitals && <CommonVitalsDisplay character={character} />}
      </div>

            {/* Weapons List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                  <Swords size={14} /> Active Weapons
                </h3>
                <button 
                  onClick={() => setShowWeapons(!showWeapons)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
                >
                  {showWeapons ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showWeapons ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showWeapons && (
                <>
                  <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                    <span className="text-sm font-medium text-gray-300">Proficiency</span>
                    <button
                      onClick={() => setShowProficiencyModifiers(true)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold transition-colors ${
                        isProficiencyModified
                          ? 'bg-dagger-gold/10 border border-dagger-gold/20 text-dagger-gold hover:bg-dagger-gold/20'
                          : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Crosshair size={12} />
                      {totalProficiency}
                    </button>
                  </div>

                  {weapons.length > 0 ? (
                    weapons.map((weapon) => {
                      const libData = weapon.library_item?.data;
                      const trait = libData?.trait || 'Strength';
                      const baseDamage = libData?.damage || '1d8';
                      const range = libData?.range || 'Melee';
                      const traitValue = character.stats[trait.toLowerCase() as keyof typeof character.stats] || 0;

                      const calculatedDamage = calculateWeaponDamage(baseDamage, totalProficiency);

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
                              <div className="text-xl font-bold text-dagger-gold">{calculatedDamage}</div>
                              <div className="text-[10px] text-gray-500 uppercase">
                                {baseDamage} × {totalProficiency}
                              </div>
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
                                const { dice, modifier } = parseDamageRoll(calculatedDamage);
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
                </>
              )}
            </div>

      {/* Active Armor */}
      {armor && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Shield size={14} /> Active Armor
            </h3>
            <button
              onClick={() => setShowArmor(!showArmor)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
            >
              {showArmor ? <EyeOff size={14} /> : <Eye size={14} />}
              {showArmor ? 'Hide' : 'Show'}
            </button>
          </div>
          {showArmor && (
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
          )}
        </div>
      )}

      {/* Class Features */}
      {character.class_data && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Info size={14} /> Class Features
            </h3>
            <button
              onClick={() => setShowClassFeatures(!showClassFeatures)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
            >
              {showClassFeatures ? <EyeOff size={14} /> : <Eye size={14} />}
              {showClassFeatures ? 'Hide' : 'Show'}
            </button>
          </div>

          {showClassFeatures && (
            <>
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
            </>
          )}
        </div>
      )}

      <ModifierSheet
        isOpen={showProficiencyModifiers}
        onClose={() => setShowProficiencyModifiers(false)}
        statLabel="proficiency"
        baseValue={baseProficiency}
        currentModifiers={userProfMods}
        onUpdateModifiers={(mods) => updateModifiers('proficiency', mods)}
      />
    </div>
  );
}

