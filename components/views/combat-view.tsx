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

import React, { useState, useEffect } from 'react';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { Shield, Swords, Zap, Skull, Crosshair, Eye, EyeOff, Wand2, Sparkles, Moon } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import clsx from 'clsx';
import { parseDamageRoll, calculateWeaponDamage, getSystemModifiers, calculateAttackModifier, calculateDamageModifier } from '@/lib/utils';
import { getLoadoutCombatAbilities } from '@/lib/combat-spell-parser';
import CommonVitalsDisplay from '@/components/common-vitals-display';
import ModifierSheet from '@/components/modifier-sheet';
import { ErrorBoundary } from '@/components/error-boundary';
import useContentAccess from '@/hooks/useContentAccess';
import { getValueColor } from '@/lib/styles';

export default function CombatView() {
  const { character, prepareRoll, updateModifiers } = useCharacterStore();
  const { includePlaytest } = useContentAccess();
  const [showProficiencyModifiers, setShowProficiencyModifiers] = useState(false);
  const [showVitals, setShowVitals] = useState(true);
  const [showWeapons, setShowWeapons] = useState(true);
  const [showSpells, setShowSpells] = useState(true);
  const [showArmor, setShowArmor] = useState(true);
  const [showTransformation, setShowTransformation] = useState(true);
  const [activeWeaponId, setActiveWeaponId] = useState<string | null>(null);
  const [activeAbilityId, setActiveAbilityId] = useState<string | null>(null);
  const [transformationCard, setTransformationCard] = useState<any>(null);

  // Fetch transformation data from library
  useEffect(() => {
    const fetchTransformation = async () => {
      if (!character?.transformation) {
        setTransformationCard(null);
        return;
      }
      try {
        const data = await dataService.library.getAll({ includePlaytest });
        if (data) {
          const transformation = data.find((lib: any) => lib.name === character.transformation && lib.type === 'transformation');
          if (transformation) {
            setTransformationCard({
              name: transformation.name,
              description: transformation.data?.description || '',
              features: transformation.data?.features || [],
            });
          }
        }
      } catch (error) {
        console.error('Failed to load transformation data:', error);
      }
    };
    fetchTransformation();
  }, [character?.transformation, includePlaytest]);

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
                        <div className={clsx("text-xl font-bold", getValueColor(damageModifier !== 0))}>
                          {calculatedDamage}
                        </div>
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
                          "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                          attackModifier !== 0 && "text-dagger-gold"
                        )}
                      >
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
                          "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
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
                      {/* Companion damage: white by default, gold if character has damage modifiers */}
                      <div className={clsx("text-xl font-bold", getValueColor(calculateDamageModifier(character) !== 0))}>
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
                        const companionAttackMod = calculateAttackModifier(character);
                        prepareRoll(`${companion.name} Attack`, companionAttackMod);
                      }}
                      className={clsx(
                        "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                        calculateAttackModifier(character) !== 0 && "text-dagger-gold"
                      )}
                    >
                      <Zap size={16} className="text-yellow-400" /> Attack
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const calculatedDamage = calculateWeaponDamage(companion.damage_die, totalProficiency);
                        const { dice, modifier } = parseDamageRoll(calculatedDamage);
                        const companionDamageMod = calculateDamageModifier(character);
                        const totalDamageBonus = modifier + companionDamageMod;
                        prepareRoll(`${companion.name} Damage`, totalDamageBonus, dice);
                      }}
                      className={clsx(
                        "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                        calculateDamageModifier(character) !== 0 && "text-dagger-gold"
                      )}
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

      {/* Transformation Abilities */}
      {character.transformation && transformationCard && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
              <Moon size={14} /> Transformation: {transformationCard.name}
            </h3>
            <button
              onClick={() => setShowTransformation(!showTransformation)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
            >
              {showTransformation ? <EyeOff size={14} /> : <Eye size={14} />}
              {showTransformation ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTransformation && (
            <>
              {transformationCard.features?.map((feature: any, index: number) => {
                // Check if this is an attack feature
                const isAttack = feature.type === 'attack' && feature.attack;

                if (isAttack) {
                  const attack = feature.attack;
                  const trait = attack.trait || 'Strength';
                  const traitKey = trait.toLowerCase();
                  const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;

                  // Get modifiers for this trait
                  const systemTraitMods = getSystemModifiers(character, traitKey);
                  const userTraitMods = character.modifiers?.[traitKey] || [];
                  const allTraitMods = [...systemTraitMods, ...userTraitMods];
                  const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                  const totalTraitValue = baseTraitValue + traitModifierSum;

                  const attackModifier = calculateAttackModifier(character);
                  const damageModifier = calculateDamageModifier(character);
                  const totalAttackBonus = totalTraitValue + attackModifier;

                  const calculatedDamage = calculateWeaponDamage(attack.damage, totalProficiency);

                  return (
                    <div
                      key={index}
                      className="bg-dagger-panel border border-purple-500/30 rounded-xl overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-colors"
                    >
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-400" />
                            <h4 className="font-serif font-bold text-purple-300 text-lg">{feature.name}</h4>
                          </div>
                          <div className="flex gap-2 text-xs text-gray-400 mt-1">
                            <span className="uppercase bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">{trait}</span>
                            <span className="uppercase bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">{attack.range}</span>
                            <span className="text-purple-400">{attack.damage_type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-purple-400">{calculatedDamage}</div>
                          <div className="text-[10px] text-gray-500 uppercase">{attack.damage} × {totalProficiency}</div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="bg-black/40 p-2 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prepareRoll(`${feature.name} Attack`, totalAttackBonus);
                          }}
                          className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-purple-500/30"
                        >
                          <Zap size={16} className="text-purple-400" /> Attack (+{totalAttackBonus})
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const { dice, modifier } = parseDamageRoll(calculatedDamage);
                            const totalDamageBonus = modifier + damageModifier;
                            prepareRoll(`${feature.name} Damage`, totalDamageBonus, dice);
                          }}
                          className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-purple-500/30"
                        >
                          <Skull size={16} className="text-red-400" /> Damage
                        </button>
                      </div>
                    </div>
                  );
                }

                // Non-attack features (passive, transformation, reaction)
                return (
                  <div key={index} className="bg-dagger-panel border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-purple-400" />
                      <h4 className="font-serif font-bold text-purple-300">{feature.name}</h4>
                      {feature.type && (
                        <span className="text-xs text-gray-500 uppercase bg-purple-500/10 px-2 py-0.5 rounded">
                          {feature.type}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {feature.text?.split('**').map((part: string, j: number) =>
                        j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                      )}
                    </div>
                    {feature.has_tokens && (
                      <div className="mt-2 text-xs text-purple-300 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                        Token Tracker: 0 / {feature.max_tokens}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

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

