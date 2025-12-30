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
 */

import React from 'react';
import clsx from 'clsx';
import { CharacterCard } from '@/store/character-store';
import { Info } from 'lucide-react';

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

  // Helper to render markdown-style bold text
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('**').map((part: string, j: number) =>
      j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
    );
  };

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
          <Info size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Collapsible Subclass Description */}
      {showLore && data.description && (
        <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3 p-3 bg-white/5 rounded-lg border border-white/5">
          {data.description}
        </p>
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
          {tierGroup.features.map((feature, featureIdx) => (
            <div key={featureIdx} className="mt-2 bg-white/5 rounded p-3 border border-white/5">
              <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                {feature.name}
              </div>
              <div className="text-sm text-gray-300 leading-relaxed">
                {renderMarkdown(feature.text)}
              </div>
            </div>
          ))}
        </div>
      ))}

      {allFeatures.length === 0 && (
        <p className="text-sm text-gray-500 italic mt-2">No features obtained yet.</p>
      )}
    </div>
  );
}
