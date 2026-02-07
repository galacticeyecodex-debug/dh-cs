'use client';

import React from 'react';
import { DomainAbilityButton } from '@/components/shared/ability-cost-button';
import { CardCosts } from '@/types/cards';

interface DomainCostsRowProps {
  cardName: string;
  /** Human-readable display name for the ability (used in notifications) */
  displayName?: string;
  costs?: CardCosts;
  // Controlled mode props
  isActiveOverride?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  className?: string;
  disabled?: boolean;
}

export function DomainCostsRow({
  cardName,
  displayName,
  costs,
  isActiveOverride,
  onActivate,
  onDeactivate,
  className,
  disabled = false,
}: DomainCostsRowProps) {
  if (!costs || (!costs.hope && !costs.stress && !costs.hit_points)) {
    return null;
  }

  return (
    <div className={className || "flex flex-wrap gap-2 justify-center"}>
      {costs.stress && (
        <DomainAbilityButton
          cardName={cardName}
          displayName={displayName}
          costType="stress"
          costValue={costs.stress}
          disabled={disabled}
          isActiveOverride={isActiveOverride}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )}
      {costs.hope && (
        <DomainAbilityButton
          cardName={cardName}
          displayName={displayName}
          costType="hope"
          costValue={costs.hope}
          disabled={disabled}
          isActiveOverride={isActiveOverride}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )}
      {costs.hit_points && (
        <DomainAbilityButton
          cardName={cardName}
          displayName={displayName}
          costType="hit_points"
          costValue={costs.hit_points}
          disabled={disabled}
          isActiveOverride={isActiveOverride}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )}
    </div>
  );
}
