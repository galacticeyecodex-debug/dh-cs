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
import { getModifiers } from '@/lib/enhancement-utils';
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
  showModifierLabel = false,
}: MechanicsTrayProps) {
  const { prepareRoll } = useCharacterStore();

  const costs = enhancement.costs;
  // @ts-ignore - gains property existence issue in some environments
  const gains = enhancement.gains;
  // @ts-ignore - tokens property existence issue
  const tokens = enhancement.tokens;

  // Only show token track if we have valid data (max > 0 or source)
  // This prevents "ghost" tracks from creating empty dividers
  const showTokenTrack = !!tokens?.has_tokens && (
    ((tokens.max_tokens ?? 0) > 0) ||
    !!tokens.token_source
  );

  const shouldShowFrequency = showFrequency && enhancement.frequency && enhancement.frequency !== 'at_will';
  const showDuration = !!enhancement.duration;

  // Extract when_active and when_active_permanent modifiers (both need activation buttons)
  const modifiers = enhancedData ? getModifiers(enhancedData) : [];
  const whenActiveModifiers = modifiers.filter(mod =>
    mod.condition?.type === 'when_active' || mod.condition?.type === 'when_active_permanent'
  );
  const hasWhenActiveModifiers = whenActiveModifiers.length > 0;

  // Determine if anything should render
  const hasCosts = showCosts && !!(costs?.stress || costs?.hope);
  const hasGains = showGains && !!(gains?.hope || gains?.stress_clear || gains?.hit_points_clear || gains?.armor_slots_clear);
  const showMechanics = showTokenTrack || shouldShowFrequency || hasAttackOrRoll || showDuration || hasWhenActiveModifiers || hasCosts || hasGains;

  if (!showMechanics) return null;

  // For controlled mode, costs gate rolls
  const needsActivation = costMode === 'controlled' && hasCosts;
  const canRoll = !needsActivation || isCostPaid;

  // Default roll handler
  const handleRoll = onRoll || (rollLabel ? () => {
    prepareRoll(`${cardName} ${rollLabel}`, rollBonus);
  } : undefined);

  // Default damage handler
  const handleDamageRoll = onDamageRoll || (finalDamage ? () => {
    const { dice, modifier } = parseDamageRoll(finalDamage);
    prepareRoll(`${cardName} Damage`, modifier, dice);
  } : undefined);

  const paddingX = variant === 'default' ? 'px-4' : 'px-0';

  // Determine if there are management actions (Costs, Gains, Duration, Frequency)
  const hasManagementActions = (showDuration && enhancement.duration && !hasWhenActiveModifiers) ||
    (costMode === 'uncontrolled' && costs && showCosts) ||
    (costMode === 'controlled' && needsActivation && showCosts) ||
    hasGains ||
    (shouldShowFrequency && enhancement.frequency);

  return (
    <div
      className={className || clsx(
        "space-y-2 w-full",
        variant === 'default' && "bg-black/40 border border-white/10 rounded-lg"
      )}
      aria-label={`mechanics-tray-${cardName}`}
      data-card-name={cardName}
    >
      {/* Token Track */}
      {showTokenTrack && (
        <div className={paddingX} aria-label="token-track-container">
          <CardTokenTrack
            cardName={cardName}
            maxTokens={tokens?.max_tokens ?? null}
            tokenSource={tokens?.token_source}
          />
        </div>
      )}

      {/* Modifier Activation Rows */}
      {hasWhenActiveModifiers && (
        <div
          className={clsx("space-y-1.5", paddingX)}
          aria-label="modifiers-container"
        >
          {showModifierLabel && (
            <h4 className="text-[10px] font-bold uppercase text-purple-400 tracking-wider text-left">
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
                className="text-sm"
              />
            );
          })}
        </div>
      )}

      {/* 2) Management Row: Spend costs + Activate + Duration + Frequency */}
      {hasManagementActions && (
        <div
          className={clsx(
            "flex flex-wrap gap-2 items-center justify-start",
            (showTokenTrack || hasWhenActiveModifiers) && "pt-3 border-t border-white/10 mt-2",
            paddingX
          )}
          aria-label="management-row"
          data-border-trigger={showTokenTrack ? 'tokens' : hasWhenActiveModifiers ? 'modifiers' : 'none'}
        >
          {/* Costs - uncontrolled mode */}
          {costMode === 'uncontrolled' && costs && showCosts && (
            <DomainCostsRow
              cardName={cardName}
              displayName={cardName}
              costs={costs}
              className="flex flex-wrap gap-2 items-center"
            />
          )}

          {/* Costs - controlled mode */}
          {costMode === 'controlled' && needsActivation && showCosts && (
            <DomainCostsRow
              cardName={cardName}
              displayName={cardName}
              costs={costs as CardCosts}
              isActiveOverride={isCostPaid}
              onActivate={onCostActivate}
              onDeactivate={onCostDeactivate}
              disabled={costDisabled}
              className="flex flex-wrap gap-2 items-center"
            />
          )}

          {/* Gains - positive action buttons (e.g., "Gain Hope", "Clear Stress") */}
          {hasGains && (
            <>
              {gains?.hope && (
                <DomainAbilityButton
                  cardName={cardName}
                  displayName={cardName}
                  // @ts-ignore
                  costType="hope_gain"
                  costValue={gains.hope}
                />
              )}
              {gains?.stress_clear && (
                <DomainAbilityButton
                  cardName={cardName}
                  displayName={cardName}
                  // @ts-ignore
                  costType="stress_clear"
                  costValue={gains.stress_clear}
                />
              )}
              {gains?.hit_points_clear && (
                <DomainAbilityButton
                  cardName={cardName}
                  displayName={cardName}
                  // @ts-ignore
                  costType="hit_points_clear"
                  costValue={gains.hit_points_clear}
                />
              )}
              {gains?.armor_slots_clear && (
                <DomainAbilityButton
                  cardName={cardName}
                  displayName={cardName}
                  // @ts-ignore
                  costType="armor_slots_clear"
                  costValue={gains.armor_slots_clear}
                />
              )}
            </>
          )}

          {/* Duration toggle */}
          {showDuration && enhancement.duration && !hasWhenActiveModifiers && (
            <DomainAbilityButton
              cardName={cardName}
              costType="duration"
              className="justify-start focus:ring-0"
            />
          )}

          {/* Frequency */}
          {shouldShowFrequency && enhancement.frequency && (
            <FrequencyCheckbox
              cardName={cardName}
              frequency={enhancement.frequency}
              className="bg-white/5 py-1.5 justify-start"
            />
          )}
        </div>
      )}

      {/* 3) Rolls Row: Attack/Spellcast + Damage rolls */}
      {hasAttackOrRoll && (
        <div
          className={clsx(
            "flex flex-wrap gap-2 items-center justify-start",
            // Add border if there were items above (Tokens, Modifiers, or Management)
            (showTokenTrack || hasWhenActiveModifiers || hasManagementActions) && "pt-3 border-t border-white/10 mt-2",
            // If no items above, no border needed (though unlikely in this flow)
            paddingX
          )}
          aria-label="rolls-row"
        >
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
      )}
    </div>
  );
}
