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
import { AppIcons } from '@/lib/icon-utils';
import { dataService } from '@/lib/data-service';

import { parseDamageRoll, calculateWeaponDamage, getScalingValue } from '@/lib/utils';
import { calculateDamageBonus, calculateAttackBonus } from '@/lib/roll-utils';
import { getStatModifiers } from '@/lib/modifier-aggregator';
import CommonVitalsDisplay from '@/components/vitals/common-vitals-display';
import ModifierSheet from '@/components/shared/modifier-sheet';
import SectionHeader from '@/components/shared/section-header';
import { ErrorBoundary } from '@/components/core/error-boundary';
import useContentAccess from '@/hooks/useContentAccess';
import ViewHeader from '@/components/shared/view-header';
import SRDInfoButton from '@/components/shared/srd-info-button';

import { AttackCard, FrequencyCheckbox, CardTokenTrack } from './';
import { hasCombatRelevance, enhanceFeature } from '@/lib/card-parser';
import { getEnhancement } from '@/lib/enhancement-utils';
import type { EnhancedAbilityCard, EnhancedAncestry, EnhancedCommunity, EnhancedFeature, Frequency } from '@/types/cards';

import { srdAncestries, srdCommunities } from '@/lib/content-loaders';

export default function CombatView() {
  const { character, prepareRoll, updateModifiers, cardStates, updateHope, updateVitals } = useCharacterStore();
  const { includePlaytest } = useContentAccess();
  const [showProficiencyModifiers, setShowProficiencyModifiers] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showWeapons, setShowWeapons] = useState(true);
  const [showSpells, setShowSpells] = useState(true);
  const [showArmor, setShowArmor] = useState(true);
  const [showTransformation, setShowTransformation] = useState(true);
  const [activeWeaponId, setActiveWeaponId] = useState<string | null>(null);
  const [activeAbilityId, setActiveAbilityId] = useState<string | null>(null);
  const [transformationCard, setTransformationCard] = useState<any>(null);
  const [showFeatures, setShowFeatures] = useState(true);
  const [showSpellcastModifiers, setShowSpellcastModifiers] = useState(false);

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

  // Derive ancestry and community data directly from static imports
  const ancestryData = useMemo(() => {
    if (!character?.ancestry) return null;
    const srdData = (srdAncestries || []) as EnhancedAncestry[];
    return srdData.find(a => a.name === character.ancestry) || null;
  }, [character?.ancestry]);

  const communityData = useMemo(() => {
    if (!character?.community) return null;
    const srdData = (srdCommunities || []) as EnhancedCommunity[];
    return srdData.find(c => c.name === character.community) || null;
  }, [character?.community]);

  // Map character loadout cards to enhanced ability data.
  // Reads enhancement/enhancement_override from library_item.data (Supabase) as the source
  // of truth, rather than name-matching against bundled JSON.
  // NOTE: This hook must be called before any early returns
  const combatAbilities = useMemo(() => {
    if (!character?.character_cards) return [];

    const loadoutCards = character.character_cards.filter(card => card.location === 'loadout');

    return loadoutCards
      .map(card => {
        const data = card.library_item?.data as EnhancedAbilityCard | undefined;
        if (!data) return null;

        if (hasCombatRelevance(getEnhancement(data))) {
          return data;
        }
        return null;
      })
      .filter((ability): ability is EnhancedAbilityCard => ability !== null);
  }, [character?.character_cards]);

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

  // Calculate Spellcast Trait and Bonus
  // NOTE: This hook must be called before any early returns
  const spellcastDetails = useMemo(() => {
    if (!character) {
      return {
        traitName: 'Instinct',
        traitKey: 'instinct',
        baseTraitValue: 0,
        totalTraitValue: 0,
        allTraitMods: [],
        allSpellcastMods: [],
        totalSpellcastBonus: 0,
        isSpellcastModified: false,
      };
    }

    const traitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait || 'Instinct';
    const traitKey = traitName.toLowerCase();
    const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;

    // Get modifiers for the base trait
    // getStatModifiers already includes user modifiers - no need to append them separately
    const allTraitMods = getStatModifiers(character, traitKey, cardStates);
    const totalTraitValue = baseTraitValue + allTraitMods.reduce((acc, mod) => acc + mod.value, 0);

    const allSpellcastMods = getStatModifiers(character, 'spellcast', cardStates);

    const totalSpellcastBonus = totalTraitValue + allSpellcastMods.reduce((acc, mod) => acc + mod.value, 0);
    const isSpellcastModified = totalSpellcastBonus !== baseTraitValue;

    return {
      traitName,
      traitKey,
      baseTraitValue,
      totalTraitValue,
      allTraitMods,
      allSpellcastMods,
      totalSpellcastBonus,
      isSpellcastModified,
    };
  }, [character, cardStates]);

  if (!character) return null;

  // Find equipped items
  const weapons = character.character_inventory?.filter(
    item => item.location === 'equipped_primary' || item.location === 'equipped_secondary'
  ) || [];

  const armor = character.character_inventory?.find(item => item.location === 'equipped_armor');

  // Calculate Proficiency with Modifiers
  const baseProficiency = character.proficiency || 1;
  const allProfMods = getStatModifiers(character, 'proficiency', cardStates);

  const totalProficiency = Math.max(1, baseProficiency + allProfMods.reduce((acc, mod) => acc + mod.value, 0));
  const isProficiencyModified = totalProficiency !== baseProficiency;

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <ViewHeader
          icon={AppIcons.combat.navCombat}
          title="Combat"
          subtitle="Manage your weapons, spells, and combat abilities"
        />

        {/* Vitals Toggle & Display */}
        <div className="space-y-2">
          <SectionHeader
            title="Vitals"
            isVisible={showVitals}
            onToggle={() => setShowVitals(!showVitals)}
          />
          {showVitals && <CommonVitalsDisplay character={character} />}
        </div>

        {/* Active Armor */}
        {armor && (
          <div className="space-y-2">
            <SectionHeader
              title={<><AppIcons.vitals.armor size={14} /> Active Armor <SRDInfoButton ruleKey="equipment.armor" title="Active Armor" /></>}
              isVisible={showArmor}
              onToggle={() => setShowArmor(!showArmor)}
            />
            {showArmor && (
              <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                {/* Armor Item Card - nested design matching weapons */}
                <div className="bg-white/5 rounded border border-white/5 p-3">
                  <h4 className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-2">{armor.name}</h4>
                  {armor.library_item?.data && (
                    <div className="text-xs text-gray-300 space-y-2">
                      {armor.library_item.data.feature?.name && (
                        <div>
                          <span className="font-bold text-dagger-gold">{armor.library_item.data.feature.name}</span>
                          <div className="text-gray-300 leading-relaxed mt-1">
                            <MarkdownText>{armor.library_item.data.feature.text}</MarkdownText>
                          </div>
                        </div>
                      )}
                      <p className="text-gray-400">Score: {armor.library_item.data.base_score}, Thresholds: {armor.library_item.data.base_thresholds}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weapons List */}
        <div className="space-y-2">
          <SectionHeader
            title={<><AppIcons.combat.navCombat size={14} /> Active Weapons <SRDInfoButton ruleKey="combat.attacking" title="Active Weapons" /></>}
            isVisible={showWeapons}
            onToggle={() => setShowWeapons(!showWeapons)}
          />

          {showWeapons && (
            <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
              {/* Proficiency Info Box */}
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
                  Proficiency
                  <SRDInfoButton ruleKey="combat.damageRolls" title="Proficiency" />
                </span>
                <button
                  onClick={() => setShowProficiencyModifiers(true)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold transition-colors ${isProficiencyModified
                    ? 'bg-dagger-gold/10 border border-dagger-gold/20 text-dagger-gold hover:bg-dagger-gold/20'
                    : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                    }`}
                  aria-label={`Adjust proficiency (currently ${totalProficiency})`}
                >
                  <AppIcons.combat.target size={12} />
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
                  const systemTraitMods = getStatModifiers(character, traitKey, cardStates);
                  const allTraitMods = systemTraitMods;

                  // Sum it up
                  const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                  const totalTraitValue = baseTraitValue + traitModifierSum;

                  // Weapons always make attack rolls per SRD
                  const attackModifier = calculateAttackBonus(character, cardStates, undefined,
                    { rollType: 'weapon' });
                  const damageModifier = calculateDamageBonus(character, cardStates);
                  const totalAttackBonus = totalTraitValue + attackModifier;

                  const calculatedDamage = calculateWeaponDamage(baseDamage, totalProficiency, damageModifier);
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
                        prepareRoll(`${weapon.name} Damage`, modifier, dice);
                      }}
                      onManageModifiers={() => setActiveWeaponId(weapon.id)}
                      costs={costs}
                      onSpendHope={() => character && updateHope(character.hope - (costs?.hope || 0))}
                      onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (costs?.stress || 0))}
                      variant="feature"
                    />
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-4 italic">No active weapons equipped.</div>
              )}

              {/* Companion Attack */}
              {character.ranger_companion && (() => {
                const companion = character.ranger_companion;
                // Companion attacks are weapon-based
                const companionAttackMod = calculateAttackBonus(character, cardStates, undefined,
                  { rollType: 'weapon' });
                const companionDamageMod = calculateDamageBonus(character, cardStates);
                const calculatedDamage = calculateWeaponDamage(companion.damage_die, totalProficiency, companionDamageMod);

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
                      prepareRoll(`${companion.name} Damage`, modifier, dice);
                    }}
                    borderVariant="companion"
                    icon={<span className="text-lg">🐾</span>}
                    badges={[{ label: 'Companion', className: 'text-dagger-gold' }]}
                    variant="feature"
                  />
                );
              })()}
            </div>
          )}
        </div>
        {/* Transformation Abilities */}
        {character.transformation && transformationCard && (
          <div className="space-y-3">
            <SectionHeader
              title={<><AppIcons.ui.downtime size={14} /> Transformation: {transformationCard.name}</>}
              isVisible={showTransformation}
              onToggle={() => setShowTransformation(!showTransformation)}
            />

            {showTransformation && (
              <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                {transformationCard.features
                  ?.filter((feature: any) => feature.type === 'attack' && feature.attack)
                  .map((feature: any, index: number) => {
                    const attack = feature.attack;
                    const trait = attack.trait || 'Strength';
                    const traitKey = trait.toLowerCase();
                    const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;

                    // Get modifiers for this trait
                    const systemTraitMods = getStatModifiers(character, traitKey, cardStates);
                    const allTraitMods = systemTraitMods;
                    const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                    const totalTraitValue = baseTraitValue + traitModifierSum;

                    // Transformation attacks are weapon-type
                    const attackModifier = calculateAttackBonus(character, cardStates, undefined,
                      { rollType: 'weapon' });
                    const damageModifier = calculateDamageBonus(character, cardStates);
                    const totalAttackBonus = totalTraitValue + attackModifier;

                    // Scale damage by proficiency, spellcast, or not at all based on damage_scaling
                    const scalingValue = getScalingValue(attack?.damage_scaling, totalProficiency, spellcastDetails.totalSpellcastBonus, 0);
                    const calculatedDamage = calculateWeaponDamage(attack.damage, scalingValue, damageModifier);

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
                          prepareRoll(`${feature.name} Damage`, modifier, dice);
                        }}
                        onMarkStress={() => character && updateVitals('stress_current', character.vitals.stress_current + (feature.costs?.stress || 0))}
                        onSpendHope={() => character && updateHope(character.hope - (feature.costs?.hope || 0))}
                        onManageModifiers={() => setActiveWeaponId(`transformation-${index}`)}
                        variant="feature"
                      />
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Traits & Features (Ancestry, Community, Class, Subclass) */}
        {combatFeatures.length > 0 && (
          <div className="space-y-3">
            <SectionHeader
              title={<><AppIcons.system.dna size={14} /> Traits & Features</>}
              isVisible={showFeatures}
              onToggle={() => setShowFeatures(!showFeatures)}
            />

            {showFeatures && (
              <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                {combatFeatures.map((feature) => {
                  const attack = feature.attack;
                  const trait = attack?.trait || 'Instinct';
                  const traitKey = trait.toLowerCase();
                  const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;

                  // Get modifiers for this trait
                  const systemTraitMods = getStatModifiers(character, traitKey, cardStates);
                  const allTraitMods = systemTraitMods;
                  const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                  const totalTraitValue = baseTraitValue + traitModifierSum;

                  // Feature may use physical or spellcast trait
                  const featureRollType = (attack?.trait?.toLowerCase() === 'spellcast') ? 'spellcast' as const : 'weapon' as const;
                  const attackModifier = calculateAttackBonus(character, cardStates, undefined,
                    { rollType: featureRollType, actionType: feature.action_type as 'attack' | undefined });
                  const damageModifier = calculateDamageBonus(character, cardStates);
                  const totalAttackBonus = totalTraitValue + attackModifier;

                  // Calculate damage - scale by proficiency, spellcast, or resource
                  const baseDamage = attack?.damage;
                  const featureCardName = `heritage-${feature.source}-${feature.name}`;
                  const tokenCount = cardStates[featureCardName]?.current_tokens || 0;
                  const scalingValue = getScalingValue(attack?.damage_scaling, totalProficiency, spellcastDetails.totalSpellcastBonus, tokenCount);
                  const calculatedDamage = baseDamage ? calculateWeaponDamage(baseDamage, scalingValue, damageModifier) : undefined;

                  // Color mapping for badges
                  const sourceColors = {
                    ancestry: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400/80',
                    community: 'border-amber-500/20 bg-amber-500/5 text-amber-400/80',
                    class: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400/80',
                    subclass: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400/80',
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
                        prepareRoll(`${feature.name} Damage`, modifier, dice);
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
                      tokenTrack={feature.tokens?.has_tokens ? (
                        <CardTokenTrack
                          cardName={`heritage-${feature.source}-${feature.name}`}
                          maxTokens={feature.tokens.max_tokens ?? null}
                          tokenSource={feature.tokens.token_source}
                          tokenLabel={feature.tokens.token_label}
                        />
                      ) : undefined}
                      variant="feature"
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Spells & Abilities */}
        {combatAbilities.length > 0 && (
          <div className="space-y-3">
            <SectionHeader
              title={<><AppIcons.combat.ability size={14} /> Spells & Abilities <SRDInfoButton ruleKey="combat.attacking" title="Spells & Abilities" /></>}
              isVisible={showSpells}
              onToggle={() => setShowSpells(!showSpells)}
            />

            {showSpells && (
              <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 space-y-3">
                {/* Spellcast Bonus Info Box */}
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                  <span className="text-sm font-medium text-gray-300">Spellcast ({spellcastDetails.traitName})</span>
                  <button
                    onClick={() => setShowSpellcastModifiers(true)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold transition-colors ${spellcastDetails.isSpellcastModified
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                      : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                      }`}
                    aria-label={`Adjust spellcast (currently ${spellcastDetails.totalSpellcastBonus})`}
                  >
                    <AppIcons.combat.ability size={12} />
                    {spellcastDetails.totalSpellcastBonus >= 0 ? `+${spellcastDetails.totalSpellcastBonus}` : spellcastDetails.totalSpellcastBonus}
                  </button>
                </div>

                {combatAbilities.map((ability) => {
                  const enhancement = getEnhancement(ability);
                  if (!enhancement) return null;

                  // ... (rest of the map logic)
                  const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
                  const rawTraitValue = spellcastTraitName
                    ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
                    : (character.spellcast || 0);

                  let traitModSum = 0;
                  if (spellcastTraitName) {
                    const tKey = spellcastTraitName.toLowerCase();
                    const tSystem = getStatModifiers(character, tKey, cardStates);
                    traitModSum = tSystem.reduce((acc, m) => acc + m.value, 0);
                  }

                  const spellcastBase = rawTraitValue + traitModSum;
                  const spellcastMods = getStatModifiers(character, 'spellcast', cardStates);
                  const totalSpellcast = spellcastBase + spellcastMods.reduce((acc, mod) => acc + mod.value, 0);

                  let rollBonus = 0;
                  let rollLabel = '';

                  if (enhancement.roll?.trait) {
                    const traitKey = enhancement.roll.trait.toLowerCase();
                    if (traitKey === 'spellcast') {
                      rollBonus = totalSpellcast;
                      rollLabel = 'Spellcast';
                    } else {
                      const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
                      const systemTraitMods = getStatModifiers(character, traitKey, cardStates);
                      rollBonus = baseTraitValue + systemTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                      rollLabel = enhancement.roll.trait;
                    }
                  } else if (enhancement.attack?.trait) {
                    const traitKey = enhancement.attack.trait.toLowerCase();
                    if (traitKey === 'spellcast') {
                      rollBonus = totalSpellcast;
                      rollLabel = 'Spellcast';
                    } else {
                      const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
                      const systemTraitMods = getStatModifiers(character, traitKey, cardStates);
                      rollBonus = baseTraitValue + systemTraitMods.reduce((acc, mod) => acc + mod.value, 0);
                      rollLabel = enhancement.attack.trait;
                    }
                  }

                  const abilityRollType = rollLabel === 'Spellcast' ? 'spellcast' as const : 'weapon' as const;
                  const attackModifier = calculateAttackBonus(character, cardStates, undefined,
                    { rollType: abilityRollType, actionType: enhancement.action_type as 'attack' | undefined });
                  const damageModifier = calculateDamageBonus(character, cardStates);
                  const finalAttackBonus = rollBonus + attackModifier;

                  const baseDamage = enhancement.attack?.damage || (enhancement as any).damage;
                  const tokenCount = cardStates[ability.name]?.current_tokens || 0;
                  const scalingValue = getScalingValue(
                    enhancement.attack?.damage_scaling || (enhancement as any).damage_scaling,
                    totalProficiency,
                    spellcastDetails.totalSpellcastBonus,
                    tokenCount
                  );
                  const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, scalingValue, damageModifier) : undefined;

                  const cardState = cardStates?.[ability.name];
                  const isUsed = getIsUsed(cardState, enhancement.frequency);

                  const badges = [];
                  if (enhancement.roll?.difficulty) {
                    badges.push({ label: `DC ${enhancement.roll.difficulty}` });
                  }

                  const borderVariant = enhancement.timing === 'reaction' ? 'reaction' : 'spell';
                  const combatCategory = enhancement.attack?.combat_category || 'passive_triggered';
                  const showAttackButton = combatCategory === 'standalone_attack' || combatCategory === 'roll_only';

                  const handleAttackRoll = (rollLabel && showAttackButton) ? () => {
                    const rollValue = enhancement.action_type === 'attack' ? finalAttackBonus : rollBonus;
                    prepareRoll(`${ability.name} ${rollLabel} Roll`, rollValue);
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
                      enhancedData={ability}
                      trait={rollLabel || 'No Roll'}
                      range={enhancement.attack?.range || (enhancement as any).range || ''}
                      baseDamage={baseDamage}
                      calculatedDamage={finalDamage}
                      totalAttackBonus={finalAttackBonus}
                      attackModifier={attackModifier}
                      damageModifier={damageModifier}
                      proficiency={totalProficiency}
                      onAttackRoll={handleAttackRoll}
                      onDamageRoll={handleDamageRoll}
                      onManageModifiers={() => setActiveAbilityId(ability.name)}
                      damageType={enhancement.attack?.damage_type}
                      badges={badges}
                      borderVariant={borderVariant as any}
                      actionType={enhancement.action_type || (enhancement.timing === 'reaction' ? 'reaction' : undefined)}
                      rollLabel={combatCategory === 'damage_bonus' ? undefined : (combatCategory === 'roll_only' ? 'Roll' : rollLabel)}
                      isUsed={isUsed}
                      description={ability.text}
                      tokenTrack={enhancement.tokens?.has_tokens ? (
                        <CardTokenTrack
                          cardName={ability.name}
                          maxTokens={enhancement.tokens.max_tokens ?? null}
                          tokenSource={enhancement.tokens.token_source}
                          tokenLabel={enhancement.tokens?.token_label}
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
                      roll={enhancement.roll ?? undefined}
                      variant="feature"
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        <ModifierSheet
          isOpen={showProficiencyModifiers}
          onClose={() => setShowProficiencyModifiers(false)}
          statLabel="proficiency"
          baseValue={baseProficiency}
          currentModifiers={allProfMods}
          onUpdateModifiers={(mods) => updateModifiers('proficiency', mods)}
        />

        {/* Spellcast Modifier Sheet */}
        <ModifierSheet
          isOpen={showSpellcastModifiers}
          onClose={() => setShowSpellcastModifiers(false)}
          statLabel="Spellcast"
          baseValue={spellcastDetails.baseTraitValue}
          currentModifiers={[]}
          onUpdateModifiers={() => { }}
          tabs={[
            {
              id: spellcastDetails.traitKey,
              label: spellcastDetails.traitName,
              baseValue: spellcastDetails.baseTraitValue,
              currentModifiers: spellcastDetails.allTraitMods,
              onUpdateModifiers: (mods: any[]) => updateModifiers(spellcastDetails.traitKey, mods)
            },
            {
              id: 'spellcast',
              label: 'Spellcast Bonus',
              baseValue: 0,
              currentModifiers: spellcastDetails.allSpellcastMods,
              onUpdateModifiers: (mods: any[]) => updateModifiers('spellcast', mods)
            }
          ]}
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
          const allTraitMods = getStatModifiers(character, traitKey, cardStates);
          const traitModifierSum = allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
          const totalTraitValue = baseTraitValue + traitModifierSum;

          // Attack Modifiers
          const allAttackMods = getStatModifiers(character, 'attack', cardStates);

          // Damage Modifiers
          const allDamageMods = getStatModifiers(character, 'damage', cardStates);

          const weaponTabs = [
            {
              id: 'attack',
              label: 'Attack',
              baseValue: totalTraitValue,
              currentModifiers: allAttackMods,
              onUpdateModifiers: (mods: any[]) => updateModifiers('attack', mods)
            },
            {
              id: 'damage',
              label: 'Damage',
              baseValue: 0,
              currentModifiers: allDamageMods,
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

          const abilityEnhancement = getEnhancement(ability);
          if (!abilityEnhancement) return null;

          const tabs = [];

          // 1. Roll Tab (Spellcast or Trait)
          const rollTrait = abilityEnhancement.roll?.trait || abilityEnhancement.attack?.trait;
          if (rollTrait) {
            if (rollTrait.toLowerCase() === 'spellcast') {
              const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
              const rawTraitValue = spellcastTraitName ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0) : (character.spellcast || 0);

              // Add trait modifiers if a trait is used
              let traitModSum = 0;
              if (spellcastTraitName) {
                const tKey = spellcastTraitName.toLowerCase();
                const tSystem = getStatModifiers(character, tKey, cardStates);
                traitModSum = tSystem.reduce((acc, m) => acc + m.value, 0);
              }

              const spellcastBase = rawTraitValue + traitModSum;
              const allSpellcastMods = getStatModifiers(character, 'spellcast', cardStates);

              tabs.push({
                id: 'spellcast',
                label: 'Spellcast',
                baseValue: spellcastBase,
                currentModifiers: allSpellcastMods,
                onUpdateModifiers: (mods: any[]) => updateModifiers('spellcast', mods)
              });
            } else {
              const traitKey = rollTrait.toLowerCase();
              const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
              const allTraitMods = getStatModifiers(character, traitKey, cardStates);

              tabs.push({
                id: traitKey,
                label: rollTrait,
                baseValue: baseTraitValue,
                currentModifiers: allTraitMods,
                onUpdateModifiers: (mods: any[]) => updateModifiers(traitKey, mods)
              });
            }
          }

          // 2. Damage Tab
          if (abilityEnhancement.attack?.damage) {
            const allDamageMods = getStatModifiers(character, 'damage', cardStates);

            tabs.push({
              id: 'damage',
              label: 'Damage',
              baseValue: 0,
              currentModifiers: allDamageMods,
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
