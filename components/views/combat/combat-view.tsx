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
import { MarkdownText } from '@/components/shared/markdown-text';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { Shield, Swords, Crosshair, Eye, EyeOff, Wand2, Moon, Dna } from 'lucide-react';
import { dataService } from '@/lib/data-service';

import { parseDamageRoll, calculateWeaponDamage, getSystemModifiers, calculateAttackModifier, calculateDamageModifier } from '@/lib/utils';
import CommonVitalsDisplay from '@/components/vitals/common-vitals-display';
import ModifierSheet from '@/components/shared/modifier-sheet';
import { ErrorBoundary } from '@/components/core/error-boundary';
import useContentAccess from '@/hooks/useContentAccess';

import { AttackCard, MarkStressButton, SpendHopeButton, FrequencyCheckbox, CardTokenTrack } from './';
import { hasCombatRelevance, enhanceFeature } from '@/lib/card-parser';
import type { EnhancedAbilityCard, EnhancedAncestry, EnhancedCommunity, EnhancedFeature, Frequency } from '@/types/cards';

export default function CombatView() {
  const { character, prepareRoll, updateModifiers, cardStates, updateHope, updateVitals } = useCharacterStore();
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
  const [showFeatures, setShowFeatures] = useState(true);
  const [ancestryData, setAncestryData] = useState<EnhancedAncestry | null>(null);
  const [communityData, setCommunityData] = useState<EnhancedCommunity | null>(null);

  // Load enhanced ability data from JSON files via dynamic import
  useEffect(() => {
    const loadEnhancedAbilities = async () => {
      try {
        // Load SRD abilities
        const srdModule = await import('@/content/srd/json/abilities_enhanced.json');
        const srdData = (srdModule.default || []) as EnhancedAbilityCard[];

        // Load Playtest abilities if enabled
        let playtestData: EnhancedAbilityCard[] = [];
        if (includePlaytest) {
          const playtestModule = await import('@/content/playtest/json/abilities_enhanced.json');
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
          const srdAncestriesModule = await import('@/content/srd/json/ancestries_enhanced.json');
          const srdAncestries = (srdAncestriesModule.default || []) as EnhancedAncestry[];
          const ancestry = srdAncestries.find(a => a.name === character.ancestry);
          setAncestryData(ancestry || null);
        } else {
          setAncestryData(null);
        }

        // Load communities from SRD only (playtest communities don't exist yet)
        if (character.community) {
          const srdCommunitiesModule = await import('@/content/srd/json/communities_enhanced.json');
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

        if (enhanced && hasCombatRelevance(enhanced.enhancement)) {
          return enhanced;
        }
        return null;
      })
      .filter((ability): ability is EnhancedAbilityCard => ability !== null);
  }, [character?.character_cards, enhancedAbilities]);

  // Filter combat-relevant ancestry, community, class, and subclass features
  const combatFeatures = useMemo(() => {
    const features: Array<EnhancedFeature & { source: string; sourceType: 'ancestry' | 'community' | 'class' | 'subclass' }> = [];

    // Ancestry Features
    if (ancestryData?.feats) {
      ancestryData.feats
        .filter(feat => hasCombatRelevance(feat))
        .forEach(feat => {
          features.push({ ...feat, source: ancestryData.name, sourceType: 'ancestry' });
        });
    } else if (character?.ancestry_features) {
      // Handle mixed ancestry or custom features stored on character
      character.ancestry_features
        .forEach((feat: any) => {
          const enhanced = enhanceFeature(feat);
          if (hasCombatRelevance(enhanced)) {
            features.push({ ...enhanced, source: character.ancestry || 'Ancestry', sourceType: 'ancestry' });
          }
        });
    }

    // Community Features
    if (communityData?.feats) {
      communityData.feats
        .filter(feat => hasCombatRelevance(feat))
        .forEach(feat => {
          features.push({ ...feat, source: communityData.name, sourceType: 'community' });
        });
    }

    // Class Features
    if (character?.class_data?.data?.class_features) {
      character.class_data.data.class_features.forEach((feat: any) => {
        const enhanced = enhanceFeature(feat);
        if (hasCombatRelevance(enhanced)) {
          features.push({ ...enhanced, source: character.class_data?.name || 'Class', sourceType: 'class' });
        }
      });
    }

    // Subclass Features
    if (character?.subclass_data?.data) {
      const data = character.subclass_data.data;
      const progression = character.subclass_progression;

      const allSubclassFeats = [
        ...(progression?.foundation_obtained ? (data.foundation_features || []) : []),
        ...(progression?.specialization_obtained ? (data.specialization_features || []) : []),
        ...(progression?.mastery_obtained ? (data.mastery_features || []) : []),
      ];

      allSubclassFeats.forEach((feat: any) => {
        const enhanced = enhanceFeature(feat);
        if (hasCombatRelevance(enhanced)) {
          features.push({ ...enhanced, source: character.subclass_data?.name || 'Subclass', sourceType: 'subclass' });
        }
      });
    }

    return features;
  }, [ancestryData, communityData, character?.ancestry, character?.ancestry_features, character?.class_data, character?.subclass_data, character?.subclass_progression]);

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
                      <div className="italic">
                        <span className="font-bold not-italic text-gray-300">{armor.library_item.data.feature.name}:</span>{' '}
                        <div className="inline-block align-top">
                          <MarkdownText>{armor.library_item.data.feature.text}</MarkdownText>
                        </div>
                      </div>
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
                  const costs = libData?.costs;

                  return (
                    <AttackCard
                      key={weapon.id}
                      id={weapon.id}
                      name={weapon.name}
                      trait={trait}
                      range={range}
                      baseDamage={baseDamage}
                      calculatedDamage={calculatedDamage}
                      totalAttackBonus={totalAttackBonus}
                      attackModifier={attackModifier}
                      damageModifier={damageModifier}
                      proficiency={totalProficiency}
                      onAttackRoll={() => prepareRoll(`${weapon.name} Attack`, totalAttackBonus)}
                      onDamageRoll={() => {
                        const { dice, modifier } = parseDamageRoll(calculatedDamage);
                        const totalDamageBonus = modifier + damageModifier;
                        prepareRoll(`${weapon.name} Damage`, totalDamageBonus, dice);
                      }}
                      onManageModifiers={() => setActiveWeaponId(weapon.id)}
                      costs={costs}
                      onSpendHope={() => character && updateHope(character.hope - (costs?.hope || 0))}
                      onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (costs?.stress || 0))}
                    />
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-4 italic">No active weapons equipped.</div>
              )}

              {/* Companion Attack */}
              {character.ranger_companion && (() => {
                const companion = character.ranger_companion;
                const companionAttackMod = calculateAttackModifier(character);
                const companionDamageMod = calculateDamageModifier(character);
                const calculatedDamage = calculateWeaponDamage(companion.damage_die, totalProficiency);

                return (
                  <AttackCard
                    id={`companion-${companion.name}`}
                    name={`${companion.name} - ${companion.attack_name}`}
                    trait={companion.attack_type || 'Instinct'}
                    range={companion.attack_range?.replace('_', ' ') || 'Melee'}
                    baseDamage={companion.damage_die}
                    calculatedDamage={calculatedDamage}
                    totalAttackBonus={companionAttackMod}
                    attackModifier={companionAttackMod}
                    damageModifier={companionDamageMod}
                    proficiency={totalProficiency}
                    onAttackRoll={() => prepareRoll(`${companion.name} Attack`, companionAttackMod)}
                    onDamageRoll={() => {
                      const { dice, modifier } = parseDamageRoll(calculatedDamage);
                      const totalDamageBonus = modifier + companionDamageMod;
                      prepareRoll(`${companion.name} Damage`, totalDamageBonus, dice);
                    }}
                    borderVariant="companion"
                    icon={<span className="text-lg">🐾</span>}
                    badges={[{ label: 'Companion', className: 'text-dagger-gold' }]}
                  />
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
                      <AttackCard
                        key={index}
                        id={`transformation-${index}`}
                        name={feature.name}
                        trait={trait}
                        range={attack.range}
                        baseDamage={attack.damage}
                        calculatedDamage={calculatedDamage}
                        totalAttackBonus={totalAttackBonus}
                        attackModifier={attackModifier}
                        damageModifier={damageModifier}
                        proficiency={totalProficiency}
                        damageType={attack.damage_type}
                        onAttackRoll={() => prepareRoll(`${feature.name} Attack`, totalAttackBonus)}
                        onDamageRoll={() => {
                          const { dice, modifier } = parseDamageRoll(calculatedDamage);
                          const totalDamageBonus = modifier + damageModifier;
                          prepareRoll(`${feature.name} Damage`, totalDamageBonus, dice);
                        }}
                        onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (feature.costs?.stress || 0))}
                        onSpendHope={() => character && updateHope(character.hope - (feature.costs?.hope || 0))}
                        onManageModifiers={() => setActiveWeaponId(`transformation-${index}`)}
                      />
                    );
                  })}
              </>
            )}
          </div>
        )}

        {/* Traits & Features (Ancestry, Community, Class, Subclass) */}
        {combatFeatures.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                <Dna size={14} /> Traits & Features
              </h3>
              <button
                onClick={() => setShowFeatures(!showFeatures)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
              >
                {showFeatures ? <EyeOff size={14} /> : <Eye size={14} />}
                {showFeatures ? 'Hide' : 'Show'}
              </button>
            </div>

            {showFeatures && combatFeatures.map((feature) => {
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
              const baseDamage = attack?.damage;
              const calculatedDamage = baseDamage ? calculateWeaponDamage(baseDamage, totalProficiency) : undefined;

              // Color mapping for badges
              const sourceColors = {
                ancestry: 'bg-emerald-500/20 text-emerald-400',
                community: 'bg-amber-500/20 text-amber-400',
                class: 'bg-cyan-500/20 text-cyan-400',
                subclass: 'bg-indigo-500/20 text-indigo-400',
              };

              // Determine if this feature needs an Attack button based on combat_category
              // damage_bonus and passive_triggered features don't need Attack buttons
              const combatCategory = attack?.combat_category || 'passive_triggered';
              const showAttackButton = combatCategory === 'standalone_attack' || combatCategory === 'roll_only';

              return (
                <AttackCard
                  key={`${feature.source}-${feature.name}`}
                  id={`heritage-${feature.source}-${feature.name}`}
                  name={feature.name}
                  trait={trait}
                  range={attack?.range || 'Self'}
                  baseDamage={baseDamage}
                  calculatedDamage={calculatedDamage}
                  totalAttackBonus={totalAttackBonus}
                  attackModifier={attackModifier}
                  damageModifier={damageModifier}
                  proficiency={totalProficiency}
                  onAttackRoll={showAttackButton ? () => prepareRoll(`${feature.name} (${trait})`, totalAttackBonus) : undefined}
                  onDamageRoll={baseDamage ? () => {
                    const { dice, modifier } = parseDamageRoll(calculatedDamage!);
                    const totalDamageBonus = modifier + damageModifier;
                    prepareRoll(`${feature.name} Damage`, totalDamageBonus, dice);
                  } : undefined}
                  onManageModifiers={() => setActiveWeaponId(`heritage-${feature.source}-${feature.name}`)}
                  borderVariant={feature.sourceType}
                  description={feature.text}
                  actionType={feature.action_type}
                  costs={feature.costs}
                  badges={[{
                    label: feature.source,
                    className: sourceColors[feature.sourceType]
                  }]}
                  onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (feature.costs?.stress || 0))}
                  onSpendHope={() => character && updateHope(character.hope - (feature.costs?.hope || 0))}
                  rollLabel={combatCategory === 'damage_bonus' ? undefined : (combatCategory === 'roll_only' ? 'Roll' : 'Attack')}
                />
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

            {showSpells && combatAbilities.map((ability) => {
              const { enhancement } = ability;

              // Calculate spellcast modifier
              const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
              const rawTraitValue = spellcastTraitName
                ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
                : (character.spellcast || 0);

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
              const totalSpellcast = spellcastBase + [...spellcastMods, ...userSpellcastMods].reduce((acc, mod) => acc + mod.value, 0);

              // Determine roll trait and bonus
              let rollBonus = 0;
              let rollLabel = '';

              if (enhancement.roll?.trait) {
                const traitKey = enhancement.roll.trait.toLowerCase();
                if (traitKey === 'spellcast') {
                  rollBonus = totalSpellcast;
                  rollLabel = 'Spellcast';
                } else {
                  const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
                  const systemTraitMods = getSystemModifiers(character, traitKey);
                  const userTraitMods = character.modifiers?.[traitKey] || [];
                  rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
                  rollLabel = enhancement.roll.trait;
                }
              } else if (enhancement.attack?.trait) {
                const traitKey = enhancement.attack.trait.toLowerCase();
                if (traitKey === 'spellcast') {
                  rollBonus = totalSpellcast;
                  rollLabel = 'Spellcast';
                } else {
                  const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
                  const systemTraitMods = getSystemModifiers(character, traitKey);
                  const userTraitMods = character.modifiers?.[traitKey] || [];
                  rollBonus = baseTraitValue + [...systemTraitMods, ...userTraitMods].reduce((acc, mod) => acc + mod.value, 0);
                  rollLabel = enhancement.attack.trait;
                }
              }

              // Calculate damage
              const baseDamage = enhancement.attack?.damage;
              const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, totalProficiency) : undefined;

              // Check if ability is used
              const cardState = cardStates?.[ability.name];
              const isUsed = getIsUsed(cardState, enhancement.frequency);

              // Prepare custom badges
              const badges = [];
              if (enhancement.roll?.difficulty) {
                badges.push({ label: `DC ${enhancement.roll.difficulty}` });
              }

              // Determine border variant
              const borderVariant = enhancement.action_type === 'reaction' ? 'reaction' : 'spell';

              // Determine combat category for button visibility
              const combatCategory = enhancement.attack?.combat_category || 'passive_triggered';
              const showAttackButton = combatCategory === 'standalone_attack' || combatCategory === 'roll_only';

              // Prepare callbacks
              const handleAttackRoll = (rollLabel && showAttackButton) ? () => {
                prepareRoll(`${ability.name} ${rollLabel} Roll`, rollBonus);
              } : undefined;

              const handleDamageRoll = finalDamage ? () => {
                const { dice, modifier } = parseDamageRoll(finalDamage);
                prepareRoll(`${ability.name} Damage`, modifier, dice);
              } : undefined;

              return (
                <AttackCard
                  key={ability.name}
                  id={ability.name}
                  name={ability.name}
                  trait={rollLabel || 'No Roll'}
                  range={enhancement.attack?.range || ''}
                  baseDamage={baseDamage}
                  calculatedDamage={finalDamage}
                  totalAttackBonus={rollBonus}
                  attackModifier={0}
                  damageModifier={0}
                  proficiency={totalProficiency}
                  onAttackRoll={handleAttackRoll}
                  onDamageRoll={handleDamageRoll}
                  onManageModifiers={() => setActiveAbilityId(ability.name)}
                  damageType={enhancement.attack?.damage_type}
                  badges={badges}
                  borderVariant={borderVariant}
                  actionType={enhancement.action_type}
                  rollLabel={combatCategory === 'damage_bonus' ? undefined : (combatCategory === 'roll_only' ? 'Roll' : rollLabel)}
                  isUsed={isUsed}
                  description={ability.text}
                  tokenTrack={enhancement.tokens?.has_tokens ? (
                    <CardTokenTrack
                      cardName={ability.name}
                      maxTokens={enhancement.tokens.max_tokens ?? null}
                      tokenSource={enhancement.tokens.token_source}
                    />
                  ) : undefined}
                  frequency={enhancement.frequency && enhancement.frequency !== 'at_will' ? (
                    <FrequencyCheckbox
                      cardName={ability.name}
                      frequency={enhancement.frequency}
                    />
                  ) : undefined}
                  costs={enhancement.costs ?? undefined}
                  onSpendHope={() => character && updateHope(character.hope - (enhancement.costs?.hope || 0))}
                  onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (enhancement.costs?.stress || 0))}
                />
              );
            })}
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

        {/* Weapon/Attack Modifier Sheet */}
        {activeWeaponId && (() => {
          // Check if it's a weapon or a transformation/companion/heritage attack
          const weapon = weapons.find(w => w.id === activeWeaponId);
          const isTransformation = activeWeaponId.startsWith('transformation-');
          const isCompanion = activeWeaponId.startsWith('companion-');
          const isHeritage = activeWeaponId.startsWith('heritage-');

          // Get trait for the attack
          let trait = 'Strength';
          let attackName = 'Attack';

          if (weapon) {
            const libData = weapon.library_item?.data;
            trait = libData?.trait || 'Strength';
            attackName = weapon.name;
          } else if (isTransformation && transformationCard) {
            // Find the matching transformation feature
            const index = parseInt(activeWeaponId.replace('transformation-', ''));
            const features = transformationCard.features?.filter((f: any) => f.type === 'attack' && f.attack) || [];
            const feature = features[index];
            if (feature) {
              trait = feature.attack?.trait || 'Strength';
              attackName = feature.name;
            }
          } else if (isCompanion && character.ranger_companion) {
            trait = character.ranger_companion.attack_type || 'Instinct';
            attackName = character.ranger_companion.name;
          } else if (isHeritage) {
            // Find the matching heritage feature
            const heritageKey = activeWeaponId.replace('heritage-', '');
            const heritageFeature = combatFeatures.find(
              f => `${f.source}-${f.name}` === heritageKey
            );
            if (heritageFeature) {
              trait = heritageFeature.attack?.trait || 'Instinct';
              attackName = heritageFeature.name;
            }
          }

          // If we couldn't find a valid attack source, don't show the sheet
          if (!weapon && !isTransformation && !isCompanion && !isHeritage) return null;

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
              statLabel={`${attackName} Modifiers`}
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
          const rollTrait = ability.enhancement.roll?.trait || ability.enhancement.attack?.trait;
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
          if (ability.enhancement.attack?.damage) {
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

/**
 * Helper to determine if card is used based on frequency type
 */
function getIsUsed(
  cardState: { used_this_rest?: boolean; used_this_long_rest?: boolean; used_this_session?: boolean } | undefined,
  frequency?: Frequency
): boolean {
  if (!cardState || !frequency || frequency === 'at_will') return false;

  switch (frequency) {
    case 'once_per_rest':
      return cardState.used_this_rest ?? false;
    case 'once_per_long_rest':
      return cardState.used_this_long_rest ?? false;
    case 'once_per_session':
      return cardState.used_this_session ?? false;
    default:
      return false;
  }
}
