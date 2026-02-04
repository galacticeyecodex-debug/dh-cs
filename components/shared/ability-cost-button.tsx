'use client';

import React from 'react';
import clsx from 'clsx';
import { useCharacterStore } from '@/store/character-store';
import { CardCosts } from '@/types/cards';
import { AppIcons, getIconByName } from '@/lib/icon-utils';
import { toast } from 'sonner';

interface DomainAbilityButtonProps {
  cardName: string;
  /**
   * Human-readable display name for the ability (used in notifications).
   * If not provided, cardName will be used.
   */
  displayName?: string;
  /**
   * Cost type determines button appearance and behavior:
   * - 'hope': Spend Hope to activate (yellow/gold styling)
   * - 'hope_gain': Gain Hope (green/gold styling) - for abilities like A Soldier's Bond
   * - 'stress': Mark Stress to activate (purple styling)
   * - 'stress_clear': Clear Stress (green/purple styling) - for abilities like Gore and Glory
   * - 'hit_points_clear': Clear Hit Points/heal (green/red styling) - for abilities like Battle-Hardened
   * - 'armor_slots_clear': Restore Armor Slots (green/blue styling) - for abilities like Champion's Edge
   * - 'activate': No cost, just toggle on/off (green styling) - for abilities like Frenzy
   * - 'duration': Persistent effect toggle (blue styling)
   * - 'free': Same as 'activate' - deprecated, use 'activate'
   */
  costType: 'hope' | 'hope_gain' | 'stress' | 'stress_clear' | 'hit_points_clear' | 'armor_slots_clear' | 'activate' | 'duration' | 'free';
  costValue?: number;
  label?: string; // Optional override
  className?: string;
  disabled?: boolean;
  // Controlled mode props
  isActiveOverride?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function DomainAbilityButton({
  cardName,
  displayName,
  costType,
  costValue = 0,
  label,
  className,
  disabled = false,
  isActiveOverride,
  onActivate,
  onDeactivate,
}: DomainAbilityButtonProps) {
  // Use displayName for notifications if provided, otherwise use cardName
  const friendlyName = displayName || cardName;
  const {
    character,
    cardStates,
    updateHope,
    updateVitals,
    toggleCardActive,
    vitalIcons,
    logActivity,
    activeCampaign
  } = useCharacterStore();

  // Resolve dynamic icons based on user preferences
  const HopeIcon = getIconByName(vitalIcons.hope, AppIcons.vitals.hope);
  const StressIcon = getIconByName(vitalIcons.stress, AppIcons.vitals.stress);

  // Use override if provided, otherwise check store
  const isActive = isActiveOverride !== undefined
    ? isActiveOverride
    : (cardStates[cardName]?.is_active || false);

  // Resolve additional icons for new types
  const HPIcon = getIconByName(vitalIcons.hitPoints, AppIcons.vitals.hitPoints);
  const ArmorIcon = getIconByName(vitalIcons.armor, AppIcons.vitals.armor);

  // Resource Tracking Logic
  let resourceInfo = '';
  if (character) {
    if (costType === 'hope' || costType === 'hope_gain') {
      resourceInfo = `(${character.hope}/6)`;
    } else if (costType === 'stress' || costType === 'stress_clear') {
      resourceInfo = `(${character.vitals.stress_current}/${character.vitals.stress_max})`;
    } else if (costType === 'hit_points_clear') {
      resourceInfo = `(${character.vitals.hit_points_current}/${character.vitals.hit_points_max})`;
    } else if (costType === 'armor_slots_clear') {
      resourceInfo = `(${character.vitals.armor_slots}/${character.vitals.armor_score})`;
    }
  }

  // Determine effective label and icon
  let displayLabel = label;
  let Icon = AppIcons.combat.activation;
  let costColor = 'text-gray-300';
  let activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';

  if (costType === 'hope') {
    displayLabel = label || `Spend ${costValue > 0 ? costValue : 'a'} Hope`;
    Icon = HopeIcon;  // Use user's preferred icon
    costColor = 'text-dagger-gold';
    activeColor = 'bg-dagger-gold/20 text-dagger-gold border-dagger-gold/50';
  } else if (costType === 'hope_gain') {
    displayLabel = label || `Gain ${costValue > 0 ? costValue : ''} Hope`;
    Icon = HopeIcon;  // Use user's preferred icon
    costColor = 'text-emerald-400';
    activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (costType === 'stress') {
    displayLabel = label || `Mark ${costValue > 0 ? costValue : 'a'} Stress`;
    Icon = StressIcon;  // Use user's preferred icon
    costColor = 'text-purple-400';
    activeColor = 'bg-purple-900/40 text-purple-300 border-purple-500/50';
  } else if (costType === 'stress_clear') {
    displayLabel = label || `Clear ${costValue > 0 ? costValue : 'a'} Stress`;
    Icon = StressIcon;
    costColor = 'text-emerald-400';
    activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (costType === 'hit_points_clear') {
    displayLabel = label || `Clear ${costValue > 0 ? costValue : 'a'} Hit Point${costValue !== 1 ? 's' : ''}`;
    Icon = HPIcon;
    costColor = 'text-emerald-400';
    activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (costType === 'armor_slots_clear') {
    displayLabel = label || `Clear ${costValue > 0 ? costValue : 'an'} Armor Slot${costValue !== 1 ? 's' : ''}`;
    Icon = ArmorIcon;
    costColor = 'text-emerald-400';
    activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (costType === 'activate' || costType === 'free') {
    // No-cost activation (e.g., Frenzy) - green styling
    displayLabel = label || (isActive ? 'Active' : 'Activate');
    Icon = AppIcons.combat.activation;  // Could use Play or Power icon if desired
    costColor = 'text-emerald-400';
    activeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (costType === 'duration') {
    displayLabel = label || (isActive ? 'Active' : 'Activate');
    Icon = AppIcons.combat.duration;
    costColor = 'text-blue-400';
    activeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/50';
  }

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || disabled) return;

    // DECOUPLED: Cost buttons ONLY pay costs, activation buttons ONLY toggle state
    if (costType === 'hope') {
      // Pay Hope cost (no activation)
      if (costValue > 0) {
        if (character.hope < costValue) return;
        updateHope(character.hope - costValue);

        // Broadcast activity if in a campaign
        if (activeCampaign) {
          logActivity({
            campaign_id: activeCampaign.id,
            user_id: character.user_id,
            character_id: character.id,
            character_name: character.name,
            activity_type: 'card_used',
            data: {
              card_id: cardName,
              card_name: friendlyName,
              card_type: 'ability',
              cost_paid: { hope: costValue }
            },
            is_private: false
          });
        }
      }
      // Call callback if provided (for custom behavior)
      if (onActivate) onActivate();
    } else if (costType === 'hope_gain') {
      // Gain Hope (for abilities like A Soldier's Bond)
      if (costValue > 0) {
        const newHope = Math.min(6, character.hope + costValue);
        updateHope(newHope);
        toast.success(`Gained ${costValue} Hope from ${friendlyName}`);

        // Broadcast activity if in a campaign
        if (activeCampaign) {
          logActivity({
            campaign_id: activeCampaign.id,
            user_id: character.user_id,
            character_id: character.id,
            character_name: character.name,
            activity_type: 'card_used',
            data: {
              card_id: cardName,
              card_name: friendlyName,
              card_type: 'ability',
              hope_gained: costValue
            },
            is_private: false
          });
        }
      }
      // Call callback if provided (for custom behavior)
      if (onActivate) onActivate();
    } else if (costType === 'stress') {
      // Pay Stress cost (no activation)
      if (costValue > 0) {
        const currentStress = character.vitals.stress_current;
        if (currentStress + costValue > character.vitals.stress_max) return;
        updateVitals('stress_current', currentStress + costValue);

        // Broadcast activity if in a campaign
        if (activeCampaign) {
          logActivity({
            campaign_id: activeCampaign.id,
            user_id: character.user_id,
            character_id: character.id,
            character_name: character.name,
            activity_type: 'card_used',
            data: {
              card_id: cardName,
              card_name: friendlyName,
              card_type: 'ability',
              cost_paid: { stress: costValue }
            },
            is_private: false
          });
        }
      }
      // Call callback if provided (for custom behavior)
      if (onActivate) onActivate();
    } else if (costType === 'stress_clear') {
      // Clear Stress (for abilities like Gore and Glory)
      const amount = costValue > 0 ? costValue : 1;
      const currentStress = character.vitals.stress_current;
      if (currentStress <= 0) return; // No stress to clear
      const newStress = Math.max(0, currentStress - amount);
      updateVitals('stress_current', newStress);
      toast.success(`Cleared ${amount} Stress from ${friendlyName}`);
      if (onActivate) onActivate();
    } else if (costType === 'hit_points_clear') {
      // Clear Hit Points / Heal (for abilities like Battle-Hardened)
      const amount = costValue > 0 ? costValue : 1;
      const currentHP = character.vitals.hit_points_current;
      const maxHP = character.vitals.hit_points_max;
      if (currentHP >= maxHP) return; // Already at full HP
      const newHP = Math.min(maxHP, currentHP + amount);
      updateVitals('hit_points_current', newHP);
      toast.success(`Cleared ${amount} Hit Point${amount !== 1 ? 's' : ''} from ${friendlyName}`);
      if (onActivate) onActivate();
    } else if (costType === 'armor_slots_clear') {
      // Restore Armor Slots (for abilities like Champion's Edge)
      const amount = costValue > 0 ? costValue : 1;
      const currentArmor = character.vitals.armor_slots;
      const maxArmor = character.vitals.armor_score;
      if (currentArmor >= maxArmor) return; // Already at full armor
      const newArmor = Math.min(maxArmor, currentArmor + amount);
      updateVitals('armor_slots', newArmor);
      toast.success(`Restored ${amount} Armor Slot${amount !== 1 ? 's' : ''} from ${friendlyName}`);
      if (onActivate) onActivate();
    } else if (costType === 'duration' || costType === 'activate' || costType === 'free') {
      // Toggle activation state (no cost payment)
      if (isActive) return; // Already active, use handleReset instead
      if (onActivate) {
        onActivate();
      } else {
        toggleCardActive(cardName);
      }
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!character || !isActive) return;

    // Just toggle off
    if (onDeactivate) {
      onDeactivate();
    } else {
      toggleCardActive(cardName);
    }
  };

  // Check affordability / availability
  const canAfford = React.useMemo(() => {
    if (!character) return false;
    if (costType === 'hope') return character.hope >= costValue;
    if (costType === 'hope_gain') return true; // Can always gain Hope (capped at 6)
    if (costType === 'stress') return character.vitals.stress_current + costValue <= character.vitals.stress_max;
    if (costType === 'stress_clear') return character.vitals.stress_current > 0; // Has stress to clear
    if (costType === 'hit_points_clear') return character.vitals.hit_points_current < character.vitals.hit_points_max; // Not at full HP
    if (costType === 'armor_slots_clear') {
      return character.vitals.armor_slots < character.vitals.armor_score; // Not at full armor
    }
    return true;
  }, [character, costType, costValue]);

  // All buttons should be disabled if they cannot be afforded (e.g. not enough Hope)
  // or if explicitly disabled by parent (e.g. already paid)
  const isCostButton = costType === 'stress' || costType === 'hope' || costType === 'hope_gain' ||
    costType === 'stress_clear' || costType === 'hit_points_clear' || costType === 'armor_slots_clear';
  const isActuallyDisabled = disabled || !canAfford;

  // Cost buttons NEVER show "active" state - they just pay resources
  // Only activation buttons show active/inactive states
  const showActiveState = !isCostButton && isActive;

  const buttonContent = (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      {showActiveState ? <AppIcons.ui.confirm size={12} /> : <Icon size={12} />}
      <span>{displayLabel}</span>
      {resourceInfo && (
        <span className="opacity-70 font-normal ml-0.5 text-[10px]">{resourceInfo}</span>
      )}
    </span>
  );

  // Activation buttons show active state with reset button
  if (showActiveState) {
    return (
      <div className={clsx(
        "flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-bold border transition-colors cursor-default",
        activeColor,
        className
      )}>
        {buttonContent}
        <button
          onClick={handleReset}
          className="ml-1 p-0.5 hover:bg-black/20 rounded-full transition-colors group"
          title="Reset / Deactivate"
        >
          <AppIcons.system.sync size={10} className="group-hover:rotate-180 transition-transform" />
        </button>
      </div>
    );
  }

  // All other states: normal button
  return (
    <button
      onClick={handleActivate}
      disabled={isActuallyDisabled}
      className={clsx(
        "flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors",
        "bg-white/5 border-white/10 hover:bg-white/10",
        isActuallyDisabled ? "opacity-50 cursor-not-allowed grayscale" : costColor,
        className
      )}
    >
      {buttonContent}
    </button>
  );
}
