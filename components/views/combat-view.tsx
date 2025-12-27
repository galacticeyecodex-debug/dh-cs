'use client';

/**
 * COMBAT VIEW
 * ----------------------------------------------------------------------------
 * This view focuses on the combat capabilities of the character.
 * 
 * FUNCTIONALITY:
 * - Displays active attack options (Weapons) with calculated damage and attack bonuses.
 * - Shows active defensive stats (Armor, Evasion).
 * - Lists Class Features that are relevant to combat (e.g., Hope features).
 * - Provides interactive buttons to roll attacks and damage directly from the UI.
 * - Allows toggling visibility of detailed proficiency modifiers.
 */

import React, { useState } from 'react';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { Shield, Swords, Zap, Skull, Info, Crosshair, Eye, EyeOff, Sparkles, Wand2 } from 'lucide-react';
import clsx from 'clsx';
import { parseDamageRoll, calculateWeaponDamage, getSystemModifiers, calculateAttackModifier, calculateDamageModifier } from '@/lib/utils';
import { getLoadoutCombatAbilities } from '@/lib/combat-spell-parser';
import CommonVitalsDisplay from '@/components/common-vitals-display'; // Import the new common component
import ModifierSheet from '@/components/modifier-sheet';
import SubclassFeatureCard from '@/components/subclass-feature-card';
import { ErrorBoundary } from '@/components/error-boundary';

export default function CombatView() {
  const { character, prepareRoll, updateModifiers } = useCharacterStore();
  const [showProficiencyModifiers, setShowProficiencyModifiers] = useState(false);
  const [showVitals, setShowVitals] = useState(true);
  const [showWeapons, setShowWeapons] = useState(true);
  const [showSpells, setShowSpells] = useState(true);
  const [showArmor, setShowArmor] = useState(true);
  const [showClassFeatures, setShowClassFeatures] = useState(true);
  const [showSubclassFeatures, setShowSubclassFeatures] = useState(true);
  const [activeWeaponId, setActiveWeaponId] = useState<string | null>(null);
  const [activeAbilityId, setActiveAbilityId] = useState<string | null>(null);

  if (!character) return null;

  // Find equipped items
  const weapons = character.character_inventory?.filter(
    item => item.location === 'equipped_primary' || item.location === 'equipped_secondary'
  ) || [];

  const armor = character.character_inventory?.find(item => item.location === 'equipped_armor');

  // Get combat abilities from loadout
  const combatAbilities = getLoadoutCombatAbilities(character.character_cards || []);

  // Calculate Proficiency with Modifiers
  const baseProficiency = character.proficiency || 1;
  const systemProfMods = getSystemModifiers(character, 'proficiency');
  const userProfMods = character.modifiers?.['proficiency'] || [];
  const allProfMods = [...systemProfMods, ...userProfMods];

  const totalProficiency = Math.max(1, baseProficiency + allProfMods.reduce((acc, mod) => acc + mod.value, 0));
  const isProficiencyModified = totalProficiency !== baseProficiency;

  return (
    <ErrorBoundary>
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
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold transition-colors ${isProficiencyModified
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
                
                // Calculate Modified Trait Value
                const traitKey = trait.toLowerCase();
                const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
                
                // Get modifiers for this trait
                const systemTraitMods = getSystemModifiers(character, traitKey);
                const userTraitMods = character.modifiers?.[traitKey] || [];
                const allTraitMods = [...systemTraitMods, ...userTraitMods];
                
                // Sum it up
                const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                const totalTraitValue = baseTraitValue + traitModifierSum;

                // Calculate attack and damage modifiers from equipment
                const attackModifier = calculateAttackModifier(character);
                const damageModifier = calculateDamageModifier(character);
                const totalAttackBonus = totalTraitValue + attackModifier;

                const calculatedDamage = calculateWeaponDamage(baseDamage, totalProficiency);

                return (
                  <div 
                    key={weapon.id} 
                    onClick={() => setActiveWeaponId(weapon.id)}
                    className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:border-white/30 transition-colors"
                  >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          prepareRoll(`${weapon.name} Attack`, totalAttackBonus);
                        }}
                        className={clsx(
                          "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors relative",
                          attackModifier !== 0 && "text-dagger-gold"
                        )}
                      >
                        {attackModifier !== 0 && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-dagger-gold rounded-full" />
                        )}
                        <Zap size={16} className="text-yellow-400" /> Attack ({totalAttackBonus >= 0 ? `+${totalAttackBonus}` : totalAttackBonus})
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const { dice, modifier } = parseDamageRoll(calculatedDamage);
                          const totalDamageBonus = modifier + damageModifier;
                          prepareRoll(`${weapon.name} Damage`, totalDamageBonus, dice);
                        }}
                        className={clsx(
                          "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors relative",
                          damageModifier !== 0 && "text-dagger-gold"
                        )}
                      >
                        {damageModifier !== 0 && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-dagger-gold rounded-full" />
                        )}
                        <Skull size={16} className="text-red-400" /> Damage {damageModifier !== 0 && `(${damageModifier >= 0 ? `+${damageModifier}` : damageModifier})`}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 text-center py-4 italic">No active weapons equipped.</div>
            )}

            {/* Companion Attack */}
            {character.ranger_companion && (() => {
              const companion = character.ranger_companion;
              return (
                <div
                  onClick={() => setActiveWeaponId(`companion-${companion.name}`)}
                  className="bg-dagger-panel border border-dagger-gold/30 rounded-xl overflow-hidden group cursor-pointer hover:border-dagger-gold/50 transition-colors"
                >
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🐾</span>
                        <h4 className="font-serif font-bold text-white text-lg">
                          {companion.name} - {companion.attack_name}
                        </h4>
                      </div>
                      <div className="flex gap-2 text-xs text-gray-400 mt-1">
                        <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">
                          {companion.attack_type}
                        </span>
                        <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">
                          {companion.attack_range?.replace('_', ' ')}
                        </span>
                        <span className="text-dagger-gold">Companion</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-dagger-gold">
                        {calculateWeaponDamage(companion.damage_die, totalProficiency)}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">
                        {companion.damage_die} × {totalProficiency}
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="bg-black/40 p-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Companion attack uses companion's experiences which are included in the dice roller
                        const attackModifier = calculateAttackModifier(character);
                        prepareRoll(`${companion.name} Attack`, attackModifier);
                      }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Zap size={16} className="text-yellow-400" /> Attack
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const calculatedDamage = calculateWeaponDamage(companion.damage_die, totalProficiency);
                        const { dice, modifier } = parseDamageRoll(calculatedDamage);
                        const damageModifier = calculateDamageModifier(character);
                        const totalDamageBonus = modifier + damageModifier;
                        prepareRoll(`${companion.name} Damage`, totalDamageBonus, dice);
                      }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Skull size={16} className="text-red-400" /> Damage
                    </button>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Spells & Abilities */}
      {combatAbilities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Wand2 size={14} /> Spells & Abilities
            </h3>
            <button
              onClick={() => setShowSpells(!showSpells)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
            >
              {showSpells ? <EyeOff size={14} /> : <Eye size={14} />}
              {showSpells ? 'Hide' : 'Show'}
            </button>
          </div>

          {showSpells && combatAbilities.map((ability) => {
            // Calculate Spellcast modifier if needed
            const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
            const rawTraitValue = spellcastTraitName ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0) : (character.spellcast || 0);
            
            // Add trait modifiers if a trait is used
            let traitModSum = 0;
            if (spellcastTraitName) {
                const tKey = spellcastTraitName.toLowerCase();
                const tSystem = getSystemModifiers(character, tKey);
                const tUser = character.modifiers?.[tKey] || [];
                traitModSum = [...tSystem, ...tUser].reduce((acc, m) => acc + m.value, 0);
            }
            
            const spellcastBase = rawTraitValue + traitModSum;
            const spellcastMods = getSystemModifiers(character, 'spellcast');
            const userSpellcastMods = character.modifiers?.['spellcast'] || [];
            const allSpellcastMods = [...spellcastMods, ...userSpellcastMods];
            const totalSpellcast = spellcastBase + allSpellcastMods.reduce((acc, mod) => acc + mod.value, 0);

            // Get appropriate trait value for the roll
            let rollBonus = 0;
            let rollLabel = '';

            if (ability.rollType === 'spellcast') {
              rollBonus = totalSpellcast;
              rollLabel = 'Spellcast';
            } else if (ability.trait) {
              const traitKey = ability.trait.toLowerCase();
              const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
              const systemTraitMods = getSystemModifiers(character, traitKey);
              const userTraitMods = character.modifiers?.[traitKey] || [];
              const allTraitMods = [...systemTraitMods, ...userTraitMods];
              rollBonus = baseTraitValue + allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
              rollLabel = ability.trait;
            }

            // Calculate damage if it uses proficiency
            const finalDamage = ability.usesProficiency && ability.damage
              ? calculateWeaponDamage(ability.damage, totalProficiency)
              : ability.damage;

            return (
              <div 
                key={ability.cardId} 
                onClick={() => setActiveAbilityId(ability.cardId)}
                className="bg-dagger-panel border border-purple-500/30 rounded-xl overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-colors"
              >
                <div className="p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-serif font-bold text-white text-lg flex items-center gap-2">
                      {ability.name}
                      {ability.costs && (
                        <div className="flex gap-1">
                          {ability.costs.hope && (
                            <span className="text-[10px] bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/30 px-1.5 py-0.5 rounded font-bold uppercase">
                              {ability.costs.hope} Hope
                            </span>
                          )}
                          {ability.costs.stress && (
                            <span className="text-[10px] bg-red-900/30 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                              {ability.costs.stress} Stress
                            </span>
                          )}
                        </div>
                      )}
                    </h4>
                    <div className="flex gap-2 text-xs text-gray-400 mt-1 flex-wrap">
                      {ability.rollType !== 'none' && rollLabel && (
                        <span className="uppercase bg-purple-900/30 border border-purple-500/30 px-1.5 py-0.5 rounded">{rollLabel}</span>
                      )}
                      {ability.range && (
                        <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{ability.range}</span>
                      )}
                      {ability.damageType && (
                        <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{ability.damageType}</span>
                      )}
                      {ability.effects && ability.effects.map(effect => (
                        <span key={effect} className="uppercase bg-orange-900/30 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded text-[10px]">
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                  {finalDamage && (
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-purple-400">{finalDamage}</div>
                      {ability.usesProficiency && (
                        <div className="text-[10px] text-gray-500 uppercase">
                          {ability.damage} × {totalProficiency}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="bg-black/40 p-2 flex gap-2">
                  {ability.rollType !== 'none' && rollLabel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prepareRoll(`${ability.name} ${rollLabel} Roll`, rollBonus);
                      }}
                      className="flex-1 py-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors text-purple-300"
                    >
                      <Sparkles size={16} /> {rollLabel} ({rollBonus >= 0 ? `+${rollBonus}` : rollBonus})
                    </button>
                  )}
                  {finalDamage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const { dice, modifier } = parseDamageRoll(finalDamage);
                        prepareRoll(`${ability.name} Damage`, modifier, dice);
                      }}
                      className="flex-1 py-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors text-purple-300"
                    >
                      <Skull size={16} className="text-red-400" /> Damage
                    </button>
                  )}
                  {ability.rollType === 'none' && !finalDamage && (
                    <div className="flex-1 py-2 text-center text-sm italic text-gray-500">
                      {ability.description.substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Subclass Features */}
      {(character.subclass_progression || character.multiclass_progression) && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> Subclass Features
            </h3>
            <button
              onClick={() => setShowSubclassFeatures(!showSubclassFeatures)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
            >
              {showSubclassFeatures ? <EyeOff size={14} /> : <Eye size={14} />}
              {showSubclassFeatures ? 'Hide' : 'Show'}
            </button>
          </div>

          {showSubclassFeatures && (
            <div className="space-y-3">
              {/* Primary Subclass Features */}
              {character.subclass_progression && (
                <>
                  {character.subclass_progression.foundation_obtained && (
                    <SubclassFeatureCard
                      card={character.character_cards?.find(c =>
                        c.location === 'feature' &&
                        !c.library_item?.data?.multiclass &&
                        (c.library_item?.data?.tier === 'foundation' || c.library_item?.type === 'subclass')
                      ) || (character.subclass_data && character.subclass_id ? { // Use subclass_data as fallback
                          id: 'primary-subclass-foundation-fallback', // Unique ID for fallback card
                          character_id: character.id,
                          card_id: character.subclass_data.id,
                          location: 'feature',
                          state: {},
                          library_item: character.subclass_data
                      } : undefined)}
                      tier="Foundation"
                      isMulticlass={false}
                    />
                  )}

                  {character.subclass_progression.specialization_obtained && (
                    <SubclassFeatureCard
                      card={character.character_cards?.find(c =>
                        c.location === 'feature' &&
                        !c.library_item?.data?.multiclass &&
                        c.library_item?.data?.tier === 'specialization'
                      ) || (character.subclass_data && character.subclass_id ? { // Use subclass_data as fallback
                          id: 'primary-subclass-specialization-fallback', // Unique ID for fallback card
                          character_id: character.id,
                          card_id: character.subclass_data.id,
                          location: 'feature',
                          state: {},
                          library_item: character.subclass_data
                      } : undefined)}
                      tier="Specialization"
                      isMulticlass={false}
                    />
                  )}

                  {character.subclass_progression.mastery_obtained && (
                    <SubclassFeatureCard
                      card={character.character_cards?.find(c =>
                        c.location === 'feature' &&
                        !c.library_item?.data?.multiclass &&
                        c.library_item?.data?.tier === 'mastery'
                      ) || (character.subclass_data && character.subclass_id ? { // Use subclass_data as fallback
                          id: 'primary-subclass-mastery-fallback', // Unique ID for fallback card
                          character_id: character.id,
                          card_id: character.subclass_data.id,
                          location: 'feature',
                          state: {},
                          library_item: character.subclass_data
                      } : undefined)}
                      tier="Mastery"
                      isMulticlass={false}
                    />
                  )}
                </>
              )}

              {/* Multiclass Subclass Features */}
              {character.multiclass_progression && (
                <>
                  {character.multiclass_progression.foundation_obtained && (
                    <SubclassFeatureCard
                      card={character.character_cards?.find(c =>
                        c.location === 'feature' &&
                        c.library_item?.data?.multiclass === true
                      )}
                      tier="Foundation"
                      isMulticlass={true}
                    />
                  )}

                  {character.multiclass_progression.specialization_obtained && (
                    <SubclassFeatureCard
                      card={character.character_cards?.find(c =>
                        c.location === 'feature' &&
                        c.library_item?.data?.multiclass === true &&
                        c.library_item?.data?.tier === 'specialization'
                      )}
                      tier="Specialization"
                      isMulticlass={true}
                    />
                  )}

                  {character.multiclass_progression.mastery_obtained && (
                    <SubclassFeatureCard
                      card={character.character_cards?.find(c =>
                        c.location === 'feature' &&
                        c.library_item?.data?.multiclass === true &&
                        c.library_item?.data?.tier === 'mastery'
                      )}
                      tier="Mastery"
                      isMulticlass={true}
                    />
                  )}
                </>
              )}
            </div>
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

      {/* Weapon Modifier Sheet */}
      {activeWeaponId && (() => {
        const weapon = weapons.find(w => w.id === activeWeaponId);
        if (!weapon) return null;

        const libData = weapon.library_item?.data;
        const trait = libData?.trait || 'Strength';
        const traitKey = trait.toLowerCase();
        
        // Calculate Base Trait Value
        const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
        const systemTraitMods = getSystemModifiers(character, traitKey);
        const userTraitMods = character.modifiers?.[traitKey] || [];
        const allTraitMods = [...systemTraitMods, ...userTraitMods];
        const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
        const totalTraitValue = baseTraitValue + traitModifierSum;

        // Attack Modifiers
        const systemAttackMods = getSystemModifiers(character, 'attack');
        const userAttackMods = character.modifiers?.['attack'] || [];
        
        // Damage Modifiers
        const systemDamageMods = getSystemModifiers(character, 'damage');
        const userDamageMods = character.modifiers?.['damage'] || [];

        const weaponTabs = [
          {
            id: 'attack',
            label: 'Attack',
            baseValue: totalTraitValue,
            currentModifiers: [...systemAttackMods, ...userAttackMods],
            onUpdateModifiers: (mods: any[]) => updateModifiers('attack', mods)
          },
          {
            id: 'damage',
            label: 'Damage',
            baseValue: 0,
            currentModifiers: [...systemDamageMods, ...userDamageMods],
            onUpdateModifiers: (mods: any[]) => updateModifiers('damage', mods)
          }
        ];

        return (
          <ModifierSheet
            isOpen={!!activeWeaponId}
            onClose={() => setActiveWeaponId(null)}
            statLabel={`${weapon.name} Modifiers`}
            baseValue={0}
            currentModifiers={[]}
            onUpdateModifiers={() => {}}
            tabs={weaponTabs}
          />
        );
      })()}

      {/* Ability Modifier Sheet */}
      {activeAbilityId && (() => {
        const ability = combatAbilities.find(a => a.cardId === activeAbilityId);
        if (!ability) return null;

        const tabs = [];

        // 1. Roll Tab (Spellcast or Trait)
        if (ability.rollType === 'spellcast') {
           const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
           const rawTraitValue = spellcastTraitName ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0) : (character.spellcast || 0);
           
           // Add trait modifiers if a trait is used
           let traitModSum = 0;
           if (spellcastTraitName) {
               const tKey = spellcastTraitName.toLowerCase();
               const tSystem = getSystemModifiers(character, tKey);
               const tUser = character.modifiers?.[tKey] || [];
               traitModSum = [...tSystem, ...tUser].reduce((acc, m) => acc + m.value, 0);
           }
           
           const spellcastBase = rawTraitValue + traitModSum;
           const spellcastMods = getSystemModifiers(character, 'spellcast');
           const userSpellcastMods = character.modifiers?.['spellcast'] || [];
           
           tabs.push({
             id: 'spellcast',
             label: 'Spellcast',
             baseValue: spellcastBase,
             currentModifiers: [...spellcastMods, ...userSpellcastMods],
             onUpdateModifiers: (mods: any[]) => updateModifiers('spellcast', mods)
           });
        } else if (ability.trait) {
           const traitKey = ability.trait.toLowerCase();
           const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
           const systemTraitMods = getSystemModifiers(character, traitKey);
           const userTraitMods = character.modifiers?.[traitKey] || [];
           
           tabs.push({
             id: traitKey,
             label: ability.trait,
             baseValue: baseTraitValue,
             currentModifiers: [...systemTraitMods, ...userTraitMods],
             onUpdateModifiers: (mods: any[]) => updateModifiers(traitKey, mods)
           });
        }

        // 2. Damage Tab
        if (ability.damage) {
           const systemDamageMods = getSystemModifiers(character, 'damage');
           const userDamageMods = character.modifiers?.['damage'] || [];

           tabs.push({
             id: 'damage',
             label: 'Damage',
             baseValue: 0,
             currentModifiers: [...systemDamageMods, ...userDamageMods],
             onUpdateModifiers: (mods: any[]) => updateModifiers('damage', mods)
           });
        }

        if (tabs.length === 0) return null;

        return (
          <ModifierSheet
            isOpen={!!activeAbilityId}
            onClose={() => setActiveAbilityId(null)}
            statLabel={`${ability.name} Modifiers`}
            baseValue={0}
            currentModifiers={[]}
            onUpdateModifiers={() => {}}
            tabs={tabs}
          />
        );
      })()}
      </div>
    </ErrorBoundary>
  );
}

