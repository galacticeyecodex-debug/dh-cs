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

import React, { useState, useEffect, useMemo } from 'react';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { Shield, Swords, Zap, Skull, Crosshair, Eye, EyeOff, Wand2, Moon, Dna } from 'lucide-react';
import { dataService } from '@/lib/data-service';
import clsx from 'clsx';
import { parseDamageRoll, calculateWeaponDamage, getSystemModifiers, calculateAttackModifier, calculateDamageModifier } from '@/lib/utils';
import CommonVitalsDisplay from '@/components/vitals/common-vitals-display';
import ModifierSheet from '@/components/modifiers/modifier-sheet';
import { ErrorBoundary } from '@/components/core/error-boundary';
import useContentAccess from '@/hooks/useContentAccess';
import { getValueColor } from '@/lib/styles';
import { CombatSpellCard } from '@/components/combat';
import { hasCombatRelevance } from '@/lib/card-parser';
import type { EnhancedAbilityCard, EnhancedAncestry, EnhancedCommunity, EnhancedFeature } from '@/types/cards';

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
  const [enhancedAbilities, setEnhancedAbilities] = useState<EnhancedAbilityCard[]>([]);
  const [showHeritageFeatures, setShowHeritageFeatures] = useState(true);
  const [ancestryData, setAncestryData] = useState<EnhancedAncestry | null>(null);
  const [communityData, setCommunityData] = useState<EnhancedCommunity | null>(null);

  // Load enhanced ability data from JSON files via dynamic import
  useEffect(() => {
    const loadEnhancedAbilities = async () => {
      try {
        // Load SRD abilities
        const srdModule = await import('@/content/srd/json/abilities.json');
        const srdData = (srdModule.default || []) as EnhancedAbilityCard[];

        // Load Playtest abilities if enabled
        let playtestData: EnhancedAbilityCard[] = [];
        if (includePlaytest) {
          const playtestModule = await import('@/content/playtest/json/abilities.json');
          playtestData = (playtestModule.default || []) as EnhancedAbilityCard[];
        }

        setEnhancedAbilities([...srdData, ...playtestData]);
      } catch (error) {
        console.error('Failed to load enhanced abilities:', error);
      }
    };
    loadEnhancedAbilities();
  }, [includePlaytest]);

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

  // Load ancestry and community data from JSON files
  useEffect(() => {
    const loadHeritageData = async () => {
      if (!character?.ancestry && !character?.community) {
        setAncestryData(null);
        setCommunityData(null);
        return;
      }

      try {
        // Load ancestries from SRD only (playtest ancestries don't exist yet)
        if (character.ancestry) {
          const srdAncestriesModule = await import('@/content/srd/json/ancestries.json');
          const srdAncestries = (srdAncestriesModule.default || []) as EnhancedAncestry[];
          const ancestry = srdAncestries.find(a => a.name === character.ancestry);
          setAncestryData(ancestry || null);
        } else {
          setAncestryData(null);
        }

        // Load communities from SRD only (playtest communities don't exist yet)
        if (character.community) {
          const srdCommunitiesModule = await import('@/content/srd/json/communities.json');
          const srdCommunities = (srdCommunitiesModule.default || []) as EnhancedCommunity[];
          const community = srdCommunities.find(c => c.name === character.community);
          setCommunityData(community || null);
        } else {
          setCommunityData(null);
        }
      } catch (error) {
        console.error('Failed to load heritage data:', error);
      }
    };
    loadHeritageData();
  }, [character?.ancestry, character?.community]);

  // Map character loadout cards to enhanced ability data
  // NOTE: This hook must be called before any early returns
  const combatAbilities = useMemo(() => {
    if (!character?.character_cards || enhancedAbilities.length === 0) return [];

    const loadoutCards = character.character_cards.filter(card => card.location === 'loadout');

    return loadoutCards
      .map(card => {
        const cardName = card.library_item?.name || '';
        // Find enhanced data for this card
        const enhanced = enhancedAbilities.find(a => a.name === cardName);

        if (enhanced && hasCombatRelevance(enhanced)) {
          return enhanced;
        }
        return null;
      })
      .filter((ability): ability is EnhancedAbilityCard => ability !== null);
  }, [character?.character_cards, enhancedAbilities]);

  // Filter combat-relevant ancestry and community features
  const combatHeritageFeatures = useMemo(() => {
    const features: Array<EnhancedFeature & { source: string; sourceType: 'ancestry' | 'community' }> = [];

    if (ancestryData?.feats) {
      ancestryData.feats
        .filter(feat => hasCombatRelevance(feat))
        .forEach(feat => {
          features.push({ ...feat, source: ancestryData.name, sourceType: 'ancestry' });
        });
    }

    if (communityData?.feats) {
      communityData.feats
        .filter(feat => hasCombatRelevance(feat))
        .forEach(feat => {
          features.push({ ...feat, source: communityData.name, sourceType: 'community' });
        });
    }

    return features;
  }, [ancestryData, communityData]);

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
                      <p className="italic">
                        <span className="font-bold not-italic text-gray-300">{armor.library_item.data.feature.name}:</span>{' '}
                        {armor.library_item.data.feature.text?.split('**').map((part: string, j: number) =>
                          j % 2 === 1 ? <strong key={j} className="text-white not-italic">{part}</strong> : part
                        )}
                      </p>
                    )}
                    <p className="mt-1">Score: {armor.library_item.data.base_score}, Thresholds: {armor.library_item.data.base_thresholds}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                            {baseDamage.replace(/\*\*/g, '')} × {totalProficiency}
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
                {transformationCard.features
                  ?.filter((feature: any) => feature.type === 'attack' && feature.attack)
                  .map((feature: any, index: number) => {
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
                        className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden group cursor-pointer hover:border-white/30 transition-colors"
                      >
                        <div className="p-4 flex justify-between items-start">
                          <div>
                            <h4 className="font-serif font-bold text-white text-lg">{feature.name}</h4>
                            <div className="flex gap-2 text-xs text-gray-400 mt-1">
                              <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{trait}</span>
                              <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{attack.range}</span>
                              <span className="text-gray-400">{attack.damage_type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={clsx("text-xl font-bold", getValueColor(damageModifier !== 0))}>{calculatedDamage}</div>
                            <div className="text-[10px] text-gray-500 uppercase">{attack.damage?.replace(/\*\*/g, '')} × {totalProficiency}</div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="bg-black/40 p-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prepareRoll(`${feature.name} Attack`, totalAttackBonus);
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
                              prepareRoll(`${feature.name} Damage`, totalDamageBonus, dice);
                            }}
                            className={clsx(
                              "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                              damageModifier !== 0 && "text-dagger-gold"
                            )}
                          >
                            <Skull size={16} className="text-red-400" /> Damage {damageModifier !== 0 && `(${damageModifier >= 0 ? `+${damageModifier}` : damageModifier})`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        )}

        {/* Heritage Features (Ancestry & Community) */}
        {combatHeritageFeatures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                <Dna size={14} /> Heritage Features
              </h3>
              <button
                onClick={() => setShowHeritageFeatures(!showHeritageFeatures)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
              >
                {showHeritageFeatures ? <EyeOff size={14} /> : <Eye size={14} />}
                {showHeritageFeatures ? 'Hide' : 'Show'}
              </button>
            </div>

            {showHeritageFeatures && combatHeritageFeatures.map((feature) => {
              const attack = feature.attack;
              const trait = attack?.trait || 'Instinct';
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

              // Calculate damage with proficiency
              const baseDamage = attack?.damage || 'd6';
              const calculatedDamage = calculateWeaponDamage(baseDamage, totalProficiency);

              return (
                <div
                  key={`${feature.source}-${feature.name}`}
                  className={clsx(
                    "bg-dagger-panel border rounded-xl overflow-hidden cursor-pointer hover:border-white/30 transition-colors",
                    feature.sourceType === 'ancestry' ? "border-emerald-500/30" : "border-amber-500/30"
                  )}
                >
                  <div className="p-4 flex justify-between items-start">
                    <div>
                      <h4 className="font-serif font-bold text-white text-lg">{feature.name}</h4>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                        <span className={clsx(
                          "uppercase px-1.5 py-0.5 rounded",
                          feature.sourceType === 'ancestry' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        )}>
                          {feature.source}
                        </span>
                        {attack?.trait && (
                          <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{attack.trait}</span>
                        )}
                        {attack?.range && (
                          <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{attack.range}</span>
                        )}
                        {feature.action_type && feature.action_type !== 'passive' && (
                          <span className={clsx(
                            "uppercase px-1.5 py-0.5 rounded",
                            feature.action_type === 'reaction' ? "bg-orange-900/30 text-orange-400" : "bg-purple-900/30 text-purple-400"
                          )}>
                            {feature.action_type}
                          </span>
                        )}
                      </div>
                      {/* Show feature text */}
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                        {feature.text.split('**').map((part, i) =>
                          i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
                        )}
                      </p>
                    </div>
                    {attack?.damage && (
                      <div className="text-right">
                        <div className={clsx("text-xl font-bold", getValueColor(damageModifier !== 0))}>
                          {calculatedDamage}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase">
                          {baseDamage} × {totalProficiency}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Bar - only show if has attack or costs */}
                  {(attack || feature.costs) && (
                    <div className="bg-black/40 p-2 flex flex-wrap gap-2">
                      {/* Cost buttons */}
                      {feature.costs?.stress && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Mark stress - this would need to be wired to the store
                          }}
                          className="px-3 py-2 bg-red-900/20 hover:bg-red-900/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors text-red-300"
                        >
                          <Zap size={14} /> +{feature.costs.stress} Stress
                        </button>
                      )}
                      {feature.costs?.hope && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Spend hope - this would need to be wired to the store
                          }}
                          className="px-3 py-2 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors text-blue-300"
                        >
                          <Zap size={14} /> -{feature.costs.hope} Hope
                        </button>
                      )}

                      {/* Attack/Roll button */}
                      {attack && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prepareRoll(`${feature.name} (${attack.trait})`, totalAttackBonus);
                          }}
                          className={clsx(
                            "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                            attackModifier !== 0 && "text-dagger-gold"
                          )}
                        >
                          <Zap size={16} className="text-yellow-400" /> Roll ({totalAttackBonus >= 0 ? `+${totalAttackBonus}` : totalAttackBonus})
                        </button>
                      )}

                      {/* Damage button */}
                      {attack?.damage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const { dice, modifier } = parseDamageRoll(calculatedDamage);
                            const totalDamageBonus = modifier + damageModifier;
                            prepareRoll(`${feature.name} Damage`, totalDamageBonus, dice);
                          }}
                          className={clsx(
                            "flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                            damageModifier !== 0 && "text-dagger-gold"
                          )}
                        >
                          <Skull size={16} className="text-red-400" /> Damage {damageModifier !== 0 && `(${damageModifier >= 0 ? `+${damageModifier}` : damageModifier})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

            {showSpells && combatAbilities.map((ability) => (
              <CombatSpellCard
                key={ability.name}
                card={ability}
                onPrepareRoll={prepareRoll}
                onClick={() => setActiveAbilityId(ability.name)}
              />
            ))}
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
              onUpdateModifiers={() => { }}
              tabs={weaponTabs}
            />
          );
        })()}

        {/* Ability Modifier Sheet */}
        {activeAbilityId && (() => {
          const ability = combatAbilities.find(a => a.name === activeAbilityId);
          if (!ability) return null;

          const tabs = [];

          // 1. Roll Tab (Spellcast or Trait)
          const rollTrait = ability.roll?.trait || ability.attack?.trait;
          if (rollTrait) {
            if (rollTrait.toLowerCase() === 'spellcast') {
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
            } else {
              const traitKey = rollTrait.toLowerCase();
              const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
              const systemTraitMods = getSystemModifiers(character, traitKey);
              const userTraitMods = character.modifiers?.[traitKey] || [];

              tabs.push({
                id: traitKey,
                label: rollTrait,
                baseValue: baseTraitValue,
                currentModifiers: [...systemTraitMods, ...userTraitMods],
                onUpdateModifiers: (mods: any[]) => updateModifiers(traitKey, mods)
              });
            }
          }

          // 2. Damage Tab
          if (ability.attack?.damage) {
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
              onUpdateModifiers={() => { }}
              tabs={tabs}
            />
          );
        })()}
      </div>
    </ErrorBoundary>
  );
}

