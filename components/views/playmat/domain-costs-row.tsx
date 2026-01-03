'use client';

import React from 'react';
import { DomainAbilityButton } from '@/components/views/playmat/domain-ability-button';
import { CardCosts } from '@/types/cards';

interface DomainCostsRowProps {
  cardName: string;
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
  costs,
  isActiveOverride,
  onActivate,
  onDeactivate,
  className,
  disabled = false,
}: DomainCostsRowProps) {
  if (!costs || (!costs.hope && !costs.stress)) {
    return null;
  }

  return (
    <div className={className || "flex flex-wrap gap-2 justify-center"}>
      {costs.stress && (
        <DomainAbilityButton
          cardName={cardName}
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
          costType="hope"
          costValue={costs.hope}
          disabled={disabled}
          isActiveOverride={isActiveOverride}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )}
    </div>
  );
}
