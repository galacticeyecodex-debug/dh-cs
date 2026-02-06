/**
 * USE CARD MECHANICS HOOK
 * ----------------------------------------------------------------------------
 * Extracts duplicated calculation logic for domain card mechanics that was
 * previously inlined across PlaymatCard, CardEnhancementPanel, and CombatView.
 *
 * Calculates proficiency, spellcast, roll trait bonus, and damage scaling
 * from a character and enhancement block, returning ready-to-use values for
 * roll/damage buttons and modifier displays.
 *
 * SRD Reference: content/public/srd/markdown/contents/Attacking.md
 * "Roll damage dice equal to your proficiency score."
 */

import { useMemo } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { getStatModifiers } from '@/lib/modifier-aggregator';
import { calculateWeaponDamage, getScalingValue } from '@/lib/utils';
import type { EnhancementBlock } from '@/types/cards';

export interface CardMechanicsResult {
  /** Total proficiency after modifiers (min 1) */
  totalProficiency: number;
  /** Total spellcast value (base trait + trait mods + spellcast mods) */
  totalSpellcast: number;
  /** Roll bonus for the attack/roll trait */
  rollBonus: number;
  /** Display label for the roll trait (e.g., "Spellcast", "Agility") */
  rollLabel: string;
  /** Scaled damage string (e.g., "3d8+2") or undefined */
  finalDamage: string | undefined;
  /** Raw base damage before scaling (e.g., "d8") */
  baseDamage: string | undefined;
  /** Whether an Attack/Roll button should be shown based on combat_category */
  showAttackButton: boolean;
  /** Whether the card has any attack or roll mechanics */
  hasAttackOrRoll: boolean;
}

/**
 * Calculate all card mechanics values from an enhancement block.
 *
 * @param enhancement - The effective enhancement block (from getEnhancement())
 * @returns Computed mechanics values for rendering roll/damage buttons
 */
export function useCardMechanics(
  enhancement: EnhancementBlock | undefined,
  cardName?: string
): CardMechanicsResult {
  const { character, cardStates } = useCharacterStore();

  return useMemo(() => {
    const defaults: CardMechanicsResult = {
      totalProficiency: 1,
      totalSpellcast: 0,
      rollBonus: 0,
      rollLabel: '',
      finalDamage: undefined,
      baseDamage: undefined,
      showAttackButton: false,
      hasAttackOrRoll: false,
    };

    if (!character || !enhancement) return defaults;

    const attack = enhancement.attack;
    const roll = enhancement.roll;
    const hasAttackOrRoll = !!(attack || roll);

    if (!hasAttackOrRoll) {
      // Still need proficiency for non-attack cards (it's used elsewhere)
      const baseProf = character.proficiency || 1;
      const allProfMods = getStatModifiers(character, 'proficiency', cardStates);
      const totalProficiency = Math.max(1, baseProf + allProfMods.reduce((acc, mod) => acc + mod.value, 0));
      return { ...defaults, totalProficiency, hasAttackOrRoll: false };
    }

    // 1. Calculate Proficiency
    const baseProf = character.proficiency || 1;
    const allProfMods = getStatModifiers(character, 'proficiency', cardStates);
    const totalProficiency = Math.max(1, baseProf + allProfMods.reduce((acc, mod) => acc + mod.value, 0));

    // 2. Calculate Spellcast value
    const spellcastTraitName = character.spellcast_trait || character.subclass_data?.data?.spellcast_trait;
    const rawSpellcastValue = spellcastTraitName
      ? (character.stats[spellcastTraitName.toLowerCase() as keyof typeof character.stats] || 0)
      : (character.spellcast || 0);
    let spellcastTraitModSum = 0;
    if (spellcastTraitName) {
      const sKey = spellcastTraitName.toLowerCase();
      const sMods = getStatModifiers(character, sKey, cardStates);
      spellcastTraitModSum = sMods.reduce((acc, m) => acc + m.value, 0);
    }
    const spellcastBase = rawSpellcastValue + spellcastTraitModSum;
    const spellcastBonusMods = getStatModifiers(character, 'spellcast', cardStates);
    const totalSpellcast = spellcastBase + spellcastBonusMods.reduce((acc, mod) => acc + mod.value, 0);

    // 3. Calculate Roll Trait Bonus
    // Skip if this is a target reaction roll (the target rolls, not the player)
    const isTargetReaction = roll?.target_reaction === true;
    let rollBonus = 0;
    let rollLabel = '';
    const rollTrait = roll?.trait || attack?.trait;

    if (rollTrait && !isTargetReaction) {
      if (rollTrait.toLowerCase() === 'spellcast') {
        rollBonus = totalSpellcast;
        rollLabel = 'Spellcast';
      } else {
        const traitKey = rollTrait.toLowerCase();
        const baseTraitValue = character.stats[traitKey as keyof typeof character.stats] || 0;
        const allTraitMods = getStatModifiers(character, traitKey, cardStates);
        rollBonus = baseTraitValue + allTraitMods.reduce((acc, mod) => acc + mod.value, 0);
        rollLabel = rollTrait;
      }
    }

    // 4. Calculate Damage
    const baseDamage = attack?.damage;
    const tokenCount = (cardName && cardStates?.[cardName]?.current_tokens) || 0;
    const scalingValue = getScalingValue(
      attack?.damage_scaling,
      totalProficiency,
      totalSpellcast,
      tokenCount
    );
    const finalDamage = baseDamage ? calculateWeaponDamage(baseDamage, scalingValue) : undefined;

    // 5. Determine if Attack button should be shown
    // Exclude target reaction rolls (the target rolls, not the player)
    const combatCategory = attack?.combat_category || 'passive_triggered';
    const playerRoll = roll && !isTargetReaction;
    const showAttackButton = !!(playerRoll || combatCategory === 'standalone_attack' || combatCategory === 'roll_only');

    return {
      totalProficiency,
      totalSpellcast,
      rollBonus,
      rollLabel,
      finalDamage,
      baseDamage,
      showAttackButton,
      hasAttackOrRoll,
    };
  }, [character, cardStates, enhancement]);
}
