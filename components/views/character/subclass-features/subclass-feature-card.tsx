'use client';

/**
 * SUBCLASS FEATURE CARD COMPONENT
 * ----------------------------------------------------------------------------
 * This component handles the rendering of subclass capabilities grouped by subclass,
 * with all tiers (Foundation, Specialization, Mastery) displayed as nested feature cards.
 *
 * CORE FUNCTIONALITY:
 * - Unified Subclass Display: Renders all obtained features for a subclass in one parent card.
 * - Tiered Feature Display: Shows features grouped by tier with visual distinction.
 * - Collapsible Lore: Toggleable subclass description.
 * - Rich Text Rendering: Uses split('**') pattern for bold text, matching Ancestry/Community cards.
 * - Contextual Styling: Applies gold accents for feature names and badges for tiers/multiclass.
 * - Interactive Elements: Cost buttons, token tracks, and frequency checkboxes for features.
 */

import React, { useMemo } from 'react';
import clsx from 'clsx';
import { CharacterCard, useCharacterStore } from '@/store/character-store';
import { Info, Dices } from 'lucide-react';
import { MarkdownText } from '@/components/shared/markdown-text';
import CardTokenTrack from '@/components/shared/token-track';
import { DomainCostsRow } from '@/components/shared/ability-costs-row';
import FrequencyCheckbox from '@/components/shared/frequency-checkbox';
import { srdSubclasses } from '@/lib/content-loaders';

interface SubclassFeatureCardProps {
  card?: CharacterCard;
  subclassProgression: {
    foundation_obtained?: boolean;
    specialization_obtained?: boolean;
    mastery_obtained?: boolean;
  };
  isMulticlass: boolean;
  showLore: boolean;
  onToggleLore: () => void;
  onCardNotFound?: () => void;
}

export default function SubclassFeatureCard({
  card,
  subclassProgression,
  isMulticlass,
  showLore,
  onToggleLore,
  onCardNotFound
}: SubclassFeatureCardProps) {
  // Look up enhanced subclass data for interactive elements
  const enhancedSubclass = useMemo(() => {
    if (!card?.library_item?.name) return null;
    const enhanced = (srdSubclasses || []) as any[];
    return enhanced.find(s => s.name === card.library_item?.name) || null;
  }, [card?.library_item?.name]);

  if (!card?.library_item) {
    onCardNotFound?.();
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-200">
        <h4 className="font-bold">Error: Subclass Feature Not Found!</h4>
        <p className="text-sm">The required card data for this subclass is missing.</p>
        {!isMulticlass && <p className="text-xs mt-2">*(For primary subclass, ensure character creation was completed correctly or that the feature card exists.)*</p>}
      </div>
    );
  }

  const item = card.library_item;
  const data = item.data || {};

  // Helper to find enhanced feature data by name and tier
  const getEnhancedFeature = (featureName: string, tier: string) => {
    if (!enhancedSubclass) return null;
    const tierKey = tier.toLowerCase() === 'foundation' ? 'foundations' :
      tier.toLowerCase() === 'specialization' ? 'specializations' : 'masteries';
    const tierFeatures = enhancedSubclass[tierKey] || [];
    return tierFeatures.find((f: any) => f.name === featureName) || null;
  };

  // Collect all features to display based on progression
  const allFeatures: Array<{ tier: string; features: Array<{ name: string; text: string }> }> = [];

  if (item.type === 'subclass') {
    if (subclassProgression.foundation_obtained && data.foundation_features?.length > 0) {
      allFeatures.push({ tier: 'Foundation', features: data.foundation_features });
    }
    if (subclassProgression.specialization_obtained && data.specialization_features?.length > 0) {
      allFeatures.push({ tier: 'Specialization', features: data.specialization_features });
    }
    if (subclassProgression.mastery_obtained && data.mastery_features?.length > 0) {
      allFeatures.push({ tier: 'Mastery', features: data.mastery_features });
    }
  } else {
    // Fallback for legacy or generic cards
    allFeatures.push({
      tier: 'Feature',
      features: [{
        name: item.name,
        text: data.text || data.description || ''
      }]
    });
  }

  return (
    <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
      {/* Header with Subclass Name and Lore Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-serif font-bold text-white">{item.name}</h4>
          {isMulticlass && (
            <span className="text-[10px] uppercase bg-dagger-gold/20 text-dagger-gold px-2 py-0.5 rounded">
              Multiclass
            </span>
          )}
        </div>
        <button
          onClick={onToggleLore}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title={showLore ? "Hide lore" : "Show lore"}
        >
          <Info size={12} className={showLore ? "text-dagger-gold" : "text-gray-400"} />
        </button>
      </div>

      {/* Collapsible Subclass Description */}
      {showLore && data.description && (
        <div className="text-sm text-gray-300 mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
          <MarkdownText>{data.description}</MarkdownText>
        </div>
      )}

      {/* Features by Tier */}
      {allFeatures.map((tierGroup, tierIdx) => (
        <div key={tierIdx}>
          {/* Tier Badge */}
          <div className="flex items-center gap-2 mt-3 mb-2">
            <span className={clsx(
              "text-[10px] uppercase px-2 py-0.5 rounded",
              tierGroup.tier === 'Foundation'
                ? "bg-dagger-gold/20 text-dagger-gold"
                : "bg-white/10 text-gray-400"
            )}>
              {tierGroup.tier}
            </span>
          </div>

          {/* Features for this tier */}
          {tierGroup.features.map((feature, featureIdx) => {
            // Look up enhanced feature data for interactive elements
            const enhancedFeature = getEnhancedFeature(feature.name, tierGroup.tier);
            const enhancement = enhancedFeature?.enhancement;
            const hasCosts = enhancement?.costs?.stress || enhancement?.costs?.hope;
            const hasTokens = enhancement?.tokens?.has_tokens;
            const hasFrequency = enhancement?.frequency && enhancement.frequency !== 'at_will';
            const cardName = `subclass-${item.name}-${tierGroup.tier}-${feature.name}`;

            return (
              <div key={featureIdx} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
                <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                  {feature.name}
                </div>
                <div className="text-sm text-gray-300 leading-relaxed">
                  <MarkdownText>{feature.text}</MarkdownText>
                </div>
                {/* Interactive elements for subclass features */}
                {(hasCosts || hasTokens || hasFrequency) && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {hasTokens && (
                      <CardTokenTrack
                        cardName={cardName}
                        maxTokens={enhancement.tokens.max_tokens ?? null}
                        tokenSource={enhancement.tokens.token_source}
                      />
                    )}
                    <div className="flex flex-wrap gap-2 items-center">
                      {hasCosts && (
                        <DomainCostsRow
                          cardName={cardName}
                          displayName={feature.name}
                          costs={enhancement.costs}
                          className="flex flex-wrap gap-2"
                        />
                      )}
                      {hasFrequency && (
                        <FrequencyCheckbox
                          cardName={cardName}
                          frequency={enhancement.frequency}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {allFeatures.length === 0 && (
        <p className="text-sm text-gray-500 italic mt-2">No features obtained yet.</p>
      )}
    </div>
  );
}
