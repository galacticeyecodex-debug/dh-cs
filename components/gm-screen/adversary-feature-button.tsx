'use client';

/**
 * ADVERSARY FEATURE CARD
 * ----------------------------------------------------------------------------
 * Card-style display for adversary features on the GM screen, modeled after
 * the player's AttackCard + MechanicsTray pattern:
 * - Bold name + type badge header
 * - Full description text via MarkdownText
 * - Cost section using DomainCostsRow (reused from MechanicsTray) for
 *   "Spend Fear" / "Mark Stress" buttons
 *
 * In readOnly mode (Adversary Browser), shows full text but no cost section.
 * In interactive mode (Pinned Adversary), shows clickable cost buttons that
 * mirror the DomainAbilityButton visual language from the player Playmat.
 *
 * The fear cost type delegates to the parent's onActivate callback since
 * Fear is a campaign-level resource managed by the campaign store, not the
 * player character store.
 */

import { MarkdownText } from '@/components/shared/markdown-text';
import { DomainCostsRow } from '@/components/shared/ability-costs-row';
import type { ClassifiedFeature } from '@/lib/card-parser';
import type { CardCosts } from '@/types/cards';
import clsx from 'clsx';

interface AdversaryFeatureButtonProps {
    classified: ClassifiedFeature;
    currentFear?: number;
    adversaryStress?: number;
    onActivate?: () => void;
    readOnly?: boolean;
}

export function AdversaryFeatureButton({
    classified,
    currentFear = 0,
    adversaryStress = 0,
    onActivate,
    readOnly = false,
}: AdversaryFeatureButtonProps) {
    const { feat, type, fearCost, stressCost } = classified;

    // Clean display name: strip type suffix (e.g. "Earth Eruption - Action" → "Earth Eruption")
    const displayName = feat.name.replace(/\s*-\s*(Action|Reaction|Passive)/i, '').trim();

    // Affordability checks
    const canAffordFear = fearCost === 0 || currentFear >= fearCost;
    const canAffordStress = stressCost === 0 || adversaryStress >= stressCost;
    const canAfford = canAffordFear && canAffordStress;

    // Type badge styling
    const typeBadge = {
        action: { label: 'Action', className: 'bg-green-500/10 border-green-500/20 text-green-400' },
        reaction: { label: 'Reaction', className: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
        passive: { label: 'Passive', className: 'bg-gray-500/10 border-gray-500/20 text-gray-400' },
    }[type];

    // Card border color by type
    const borderColor = type === 'passive'
        ? 'border-white/5'
        : fearCost > 0
            ? 'border-red-500/20'
            : stressCost > 0
                ? 'border-purple-500/20'
                : type === 'reaction'
                    ? 'border-orange-500/20'
                    : 'border-white/10';

    // Build CardCosts object for DomainCostsRow
    const costs: CardCosts = {};
    if (fearCost > 0) costs.fear = fearCost;
    if (stressCost > 0) costs.stress = stressCost;

    const hasCost = fearCost > 0 || stressCost > 0;
    const showCostSection = !readOnly && hasCost && type !== 'passive';

    return (
        <div className={clsx(
            'bg-white/5 rounded-lg border overflow-hidden transition-colors',
            borderColor,
        )}>
            {/* Header: Name + Type Badge */}
            <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif font-bold text-white text-sm">{displayName}</h4>
                    <span className={clsx(
                        'uppercase px-1.5 py-0.5 rounded-sm font-semibold border text-[10px]',
                        typeBadge.className,
                    )}>
                        {typeBadge.label}
                    </span>
                </div>
            </div>

            {/* Body: Full feature text */}
            <div className="px-3 pb-3">
                <MarkdownText className="text-xs text-gray-300 leading-relaxed">
                    {feat.text}
                </MarkdownText>
            </div>

            {/* MechanicsTray-style Cost Section (interactive mode only) */}
            {showCostSection && (
                <div className="border-t border-white/10 bg-black/20 px-3 py-2.5 space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase text-white/40 tracking-wider text-left">
                        Cost
                    </h4>
                    <DomainCostsRow
                        cardName={displayName}
                        displayName={displayName}
                        costs={costs}
                        disabled={!canAfford}
                        onActivate={onActivate}
                        className="flex flex-wrap gap-2 items-center justify-start"
                    />
                </div>
            )}
        </div>
    );
}
