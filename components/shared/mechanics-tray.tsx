/**
 * MECHANICS TRAY
 * ----------------------------------------------------------------------------
 * Unified renderer for card mechanics sections shared between PlaymatCard and
 * AttackCard (combat view). Renders token tracks, frequency checkboxes,
 * modifier activation rows, duration toggles, cost buttons, and roll/damage
 * buttons in a consistent layout.
 *
 * Supports two cost modes:
 * - 'uncontrolled': Costs are independent buttons (Playmat style)
 * - 'controlled': Costs gate roll buttons via parent state (Combat style)
 */

'use client';

import React from 'react';
import clsx from 'clsx';
import CardTokenTrack from '@/components/shared/token-track';
import FrequencyCheckbox from '@/components/shared/frequency-checkbox';
import { DomainAbilityButton } from '@/components/shared/ability-cost-button';
import { DomainCostsRow } from '@/components/shared/ability-costs-row';
import ModifierActivationRow from '@/components/shared/modifier-activation-row';
import { RollButton } from '@/components/shared/roll-button';
import { AppIcons } from '@/lib/icon-utils';
import { parseDamageRoll } from '@/lib/utils';
import { getModifiers, isModifierActive } from '@/lib/enhancement-utils';
import { calculateDynamicValue } from '@/lib/card-parser';
import type { EnhancedAbilityCard, EnhancementBlock, CardCosts, ModifierCondition } from '@/types/cards';
import { useCharacterStore } from '@/store/character-store';

/** Helper to generate condition text from a modifier condition */
function getConditionText(condition?: ModifierCondition): string | undefined {
  if (!condition) return undefined;
  switch (condition.type) {
    case 'when_active':
      return 'Activate to apply this bonus';
    case 'when_active_permanent':
      return 'Permanent bonus (choose to apply)';
    case 'when_armored':
      return 'While wearing armor';
    case 'when_unarmored':
      return 'While not wearing armor';
    case 'loadout_domain_count':
      return `With ${condition.minCount}+ ${condition.domain} cards`;
    case 'always':
      return 'Always active';
    default:
      return undefined;
  }
}

export interface MechanicsTrayProps {
  /** The card name used for state keys (token track, frequency, costs) */
  cardName: string;
  /** The enhancement block for this card */
  enhancement: EnhancementBlock;
  /** The full enhanced ability card data (needed for modifier extraction) */
  enhancedData?: EnhancedAbilityCard;

  // --- Roll/Damage values (from useCardMechanics) ---
  /** Whether to show the attack/roll button */
  showAttackButton?: boolean;
  /** Whether there is any attack or roll on this card */
  hasAttackOrRoll?: boolean;
  /** Roll bonus value */
  rollBonus?: number;
  /** Roll label (e.g., "Spellcast", "Agility") */
  rollLabel?: string;
  /** Scaled damage string */
  finalDamage?: string;
  /** Callback when roll button is clicked */
  onRoll?: () => void;
  /** Callback when damage button is clicked */
  onDamageRoll?: () => void;

  // --- Additional damage ---
  additionalDamage?: Array<{ damage: string; label?: string }>;
  onAdditionalDamageRoll?: (damage: string, label: string) => void;

  // --- Cost mode ---
  /** 'uncontrolled': costs are independent buttons. 'controlled': costs gate rolls via isCostPaid. */
  costMode?: 'uncontrolled' | 'controlled';
  /** For controlled mode: whether cost has been paid */
  isCostPaid?: boolean;
  /** For controlled mode: callback when cost is activated */
  onCostActivate?: () => void;
  /** For controlled mode: callback when cost is deactivated */
  onCostDeactivate?: () => void;
  /** For controlled mode: whether cost buttons are disabled */
  costDisabled?: boolean;

  /** Additional CSS class */
  className?: string;
  /** Visual variant: 'default' has border/bg, 'nested' is transparent */
  variant?: 'default' | 'nested';
  /** Whether to render costs (default true). Set false if parent handles costs. */
  showCosts?: boolean;
  /** Whether to render gains (default true). Set false if parent handles gains. */
  showGains?: boolean;
  /** Whether to render frequency (default true). Set false if parent handles frequency. */
  showFrequency?: boolean;
  /** Whether to show the 'Modifiers' section label (default false) */
  showModifierLabel?: boolean;
}

export default function MechanicsTray({
  cardName,
  enhancement,
  enhancedData,
  showAttackButton = false,
  hasAttackOrRoll = false,
  rollBonus = 0,
  rollLabel = '',
  finalDamage,
  onRoll,
  onDamageRoll,
  additionalDamage,
  onAdditionalDamageRoll,
  costMode = 'uncontrolled',
  isCostPaid = false,
  onCostActivate,
  onCostDeactivate,
  costDisabled = false,
  className,
  variant = 'default',
  showCosts = true,
  showGains = true,
  showFrequency = true,
  showModifierLabel = true,
}: MechanicsTrayProps) {
  const { prepareRoll, character, cardStates } = useCharacterStore();

  const costs = enhancement.costs;
  const gains = enhancement.gains;
  const tokens = enhancement.tokens;

  // 1. Data Analysis (Determine what we HAVE)
  const hasTokenTrack = !!tokens?.has_tokens && (
    ((tokens.max_tokens ?? 0) > 0) ||
    !!tokens.token_source
  );

  const hasFrequency = !!enhancement.frequency && enhancement.frequency !== 'at_will';
  const hasDuration = !!enhancement.duration;

  const modifiers = enhancedData ? getModifiers(enhancedData) : [];
  const whenActiveModifiers = modifiers.filter(mod =>
    mod.condition?.type === 'when_active' ||
    mod.condition?.type === 'when_active_permanent' ||
    mod.condition?.type === 'loadout_domain_count'
  );
  const hasModifiers = whenActiveModifiers.length > 0;

  const hasCosts = !!(costs?.stress || costs?.hope || costs?.hit_points);
  const hasGainsData = !!(gains?.hope || gains?.stress_clear || gains?.hit_points_clear || gains?.armor_slots_clear);

  // 2. Logic (Determine what to SHOW)
  const showTokenTrack = hasTokenTrack;
  const shouldShowFrequency = showFrequency && hasFrequency;
  const showDuration = hasDuration;
  const showCostsInTray = showCosts && hasCosts;
  const showGainsInTray = showGains && hasGainsData;

  // Controllers
  const needsActivation = costMode === 'controlled' && showCostsInTray;
  const canRoll = !needsActivation || isCostPaid;

  // Default handlers
  const handleRoll = onRoll || (rollLabel ? () => {
    prepareRoll(`${cardName} ${rollLabel}`, rollBonus);
  } : undefined);

  const handleDamageRoll = onDamageRoll || (finalDamage ? () => {
    const { dice, modifier } = parseDamageRoll(finalDamage);
    prepareRoll(`${cardName} Damage`, modifier, dice);
  } : undefined);

  // Determine if there are actual rolls to display
  const hasActualRolls = hasAttackOrRoll && (
    (showAttackButton && !!handleRoll) ||
    (!!finalDamage) ||
    (additionalDamage && additionalDamage.length > 0)
  );

  // Final visibility check
  const showMechanics = showTokenTrack || shouldShowFrequency || hasActualRolls || showDuration || hasModifiers || showCostsInTray || showGainsInTray;

  const paddingX = variant === 'default' ? 'px-4' : 'px-0';

  if (!showMechanics) {
    return (
      <div className={clsx("text-xs italic text-white/30 py-1", paddingX)}>
        This card has abilities that are not yet supported.
      </div>
    );
  }

  // Management actions aggregate check for dividers
  const hasManagementActions = (showDuration && !hasModifiers) ||
    showCostsInTray ||
    showGainsInTray ||
    shouldShowFrequency;

  return (
    <div
      className={className || clsx(
        "space-y-2 w-full",
        variant === 'default' && "bg-black/40 border border-white/10 rounded-lg"
      )}
      aria-label={`mechanics-tray-${cardName}`}
      data-card-name={cardName}
    >
      {/* Token Track Section */}
      {showTokenTrack && (
        <div className={clsx("space-y-1.5", paddingX)} aria-label="token-track-container">
          <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
            Tokens
          </h4>
          <CardTokenTrack
            cardName={cardName}
            maxTokens={tokens?.max_tokens ?? null}
            tokenSource={tokens?.token_source}
          />
        </div>
      )}

      {/* Modifier Section */}
      {hasModifiers && (
        <div
          className={clsx(
            "space-y-1.5",
            paddingX,
            (showModifierLabel && showTokenTrack) && "pt-3 border-t border-white/10 mt-2"
          )}
          aria-label="modifiers-container"
        >
          {showModifierLabel && (
            <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
              Modifiers
            </h4>
          )}
          {whenActiveModifiers.map((mod, index) => {
            const modifierKey = `${mod.stat}-${index}`;
            return (
              <ModifierActivationRow
                key={`${cardName}-${mod.stat}-${index}`}
                cardName={cardName}
                modifier={mod}
                modifierKey={modifierKey}
                conditionText={getConditionText(mod.condition)}
                domain={enhancedData?.domain}
                className="text-sm"
              />
            );
          })}
        </div>
      )}

      {/* Section Order: Cost → Benefit → Rolls → Frequency */}

      {/* Cost Section */}
      {showCostsInTray && (
        <div className={clsx(
          "space-y-1.5",
          paddingX,
          (showTokenTrack || hasModifiers) && "pt-3 border-t border-white/10 mt-2"
        )}>
          <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
            Cost
          </h4>
          <div className="flex flex-wrap gap-2 items-center justify-start">
            <DomainCostsRow
              cardName={cardName}
              displayName={cardName}
              costs={costs as CardCosts}
              isActiveOverride={costMode === 'controlled' ? isCostPaid : undefined}
              onActivate={costMode === 'controlled' ? onCostActivate : undefined}
              onDeactivate={costMode === 'controlled' ? onCostDeactivate : undefined}
              disabled={costMode === 'controlled' ? costDisabled : false}
              className="flex flex-wrap gap-2 items-center"
            />
          </div>
        </div>
      )}

      {/* Benefit Section */}
      {(showGainsInTray || (showDuration && !hasModifiers)) && (
        <div className={clsx(
          "space-y-1.5",
          paddingX,
          (showTokenTrack || hasModifiers || showCostsInTray) && "pt-3 border-t border-white/10 mt-2"
        )}>
          <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
            Benefit
          </h4>
          <div className="flex flex-wrap gap-2 items-center justify-start">
            {gains?.hope && (
              <DomainAbilityButton
                cardName={cardName}
                displayName={cardName}
                costType="hope_gain"
                costValue={gains.hope}
              />
            )}
            {gains?.stress_clear && (
              <DomainAbilityButton
                cardName={cardName}
                displayName={cardName}
                costType="stress_clear"
                costValue={gains.stress_clear}
              />
            )}
            {gains?.hit_points_clear && (
              <DomainAbilityButton
                cardName={cardName}
                displayName={cardName}
                costType="hit_points_clear"
                costValue={gains.hit_points_clear}
              />
            )}
            {gains?.armor_slots_clear && (
              <DomainAbilityButton
                cardName={cardName}
                displayName={cardName}
                costType="armor_slots_clear"
                costValue={gains.armor_slots_clear}
              />
            )}
            {showDuration && !hasModifiers && (
              <DomainAbilityButton
                cardName={cardName}
                costType="duration"
                className="justify-start focus:ring-0"
              />
            )}
          </div>
        </div>
      )}

      {/* Rolls Section */}
      {hasActualRolls && (
        <div
          className={clsx(
            "space-y-1.5",
            paddingX,
            (showTokenTrack || hasModifiers || showCostsInTray || showGainsInTray || (showDuration && !hasModifiers)) && "pt-3 border-t border-white/10 mt-2"
          )}
          aria-label="rolls-row"
        >
          <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
            Rolls
          </h4>
          <div className="flex flex-wrap gap-2 items-center justify-start">
            {showAttackButton && handleRoll && (
              <RollButton
                label={rollLabel || 'Attack'}
                onClick={handleRoll}
                bonus={rollBonus}
                disabled={!canRoll}
                variant="primary"
              />
            )}

            {finalDamage && handleDamageRoll && (
              <RollButton
                label={`Damage (${finalDamage})`}
                onClick={handleDamageRoll}
                disabled={!canRoll}
                variant="damage"
                icon={AppIcons.combat.damage}
              />
            )}

            {additionalDamage?.map((extra, idx) => (
              <RollButton
                key={idx}
                label={`${extra.damage}${extra.label ? ` ${extra.label}` : ''}`}
                onClick={() => {
                  if (onAdditionalDamageRoll) {
                    onAdditionalDamageRoll(extra.damage, extra.label || 'Extra');
                  } else {
                    const { dice, modifier } = parseDamageRoll(extra.damage);
                    prepareRoll(`${cardName} ${extra.label || 'Extra'}`, modifier, dice);
                  }
                }}
                disabled={!canRoll}
                variant="damage"
                className="opacity-90"
              />
            ))}
          </div>
        </div>
      )}

      {/* Frequency Section (last) */}
      {shouldShowFrequency && (
        <div className={clsx(
          "space-y-1.5",
          paddingX,
          (showTokenTrack || hasModifiers || showCostsInTray || showGainsInTray || (showDuration && !hasModifiers) || hasActualRolls) && "pt-3 border-t border-white/10 mt-2"
        )}>
          <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
            Frequency
          </h4>
          <FrequencyCheckbox
            cardName={cardName}
            frequency={enhancement.frequency!}
            className="bg-white/5 py-1.5 justify-start"
          />
        </div>
      )}
    </div>
  );
}
