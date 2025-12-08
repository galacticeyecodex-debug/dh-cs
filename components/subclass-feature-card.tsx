'use client';

/**
 * SUBCLASS FEATURE CARD COMPONENT
 * ----------------------------------------------------------------------------
 * This component handles the rendering of specific subclass capabilities at distinct progression tiers 
 * (Foundation, Specialization, and Mastery). It serves as a focused view for class identifiers and abilities.
 * 
 * CORE FUNCTIONALITY:
 * - Tiered Feature Display: Extracts and displays only the relevant features for the requested tier 
 *   from the subclass data structure.
 * - Robust Error Handling: displays a user-friendly error message if the required card data is missing, 
 *   helping to debug character state issues (e.g. missing Foundation cards).
 * - Rich Text Rendering: Utilizes ReactMarkdown to properly format feature descriptions.
 * - Contextual Styling: Applies distinct visual cues for Foundation features (gold accents) vs 
 *   generic features, and includes badges for Multiclass contexts.
 */

import React from 'react';
import clsx from 'clsx';
import { CharacterCard } from '@/store/character-store';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

interface SubclassFeatureCardProps {
  card?: CharacterCard;
  tier: 'Foundation' | 'Specialization' | 'Mastery';
  isMulticlass: boolean;
  onCardNotFound?: () => void;
}

export default function SubclassFeatureCard({ card, tier, isMulticlass, onCardNotFound }: SubclassFeatureCardProps) {
  if (!card?.library_item) {
    onCardNotFound?.();
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-red-200">
        <h4 className="font-bold">Error: {tier} Feature Not Found!</h4>
        <p className="text-sm">The required card data for this {tier} feature is missing. Please contact support or the GM.</p>
        {!isMulticlass && <p className="text-xs mt-2">*(For primary subclass, ensure character creation was completed correctly or that the feature card exists.)*</p>}
      </div>
    );
  }

  const isFoundation = tier === 'Foundation';
  const item = card.library_item;
  const data = item.data || {};

  // Determine features to display based on tier and item type
  let featuresToDisplay: Array<{ name: string; text: string }> = [];

  if (item.type === 'subclass') {
    if (tier === 'Foundation' && data.foundation_features) {
      featuresToDisplay = data.foundation_features;
    } else if (tier === 'Specialization' && data.specialization_features) {
      featuresToDisplay = data.specialization_features;
    } else if (tier === 'Mastery' && data.mastery_features) {
      featuresToDisplay = data.mastery_features;
    }
  } else {
    // Fallback for legacy or generic cards
    featuresToDisplay = [{
      name: item.name,
      text: data.text || data.description || ''
    }];
  }

  return (
    <div className={clsx(
      "bg-dagger-panel rounded-xl p-4 relative overflow-hidden",
      isFoundation ? "border border-dagger-gold/30" : "border border-white/10"
    )}>
      {isFoundation && <div className="absolute top-0 left-0 w-1 h-full bg-dagger-gold" />}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* Header with Item Name (e.g. "Nightwalker") if it's the subclass itself */}
          {item.type === 'subclass' && (
            <h4 className={clsx(
              "font-serif font-bold text-base text-gray-300 mb-2"
            )}>
              {item.name} {tier} Features
            </h4>
          )}
        </div>
        <div className="flex gap-1">
          <span className="text-[10px] uppercase bg-white/10 px-2 py-0.5 rounded">
            {tier}
          </span>
          {isMulticlass && (
            <span className="text-[10px] uppercase bg-dagger-gold/20 text-dagger-gold px-2 py-0.5 rounded">
              Multiclass
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {featuresToDisplay.map((feature, idx) => (
          <div key={idx} className="relative">
            <h5 className="font-bold text-white mb-1">{feature.name}</h5>
            <div className="prose prose-invert text-gray-300 text-sm">
              <ReactMarkdown>{feature.text}</ReactMarkdown>
            </div>          </div>
        ))}
        {featuresToDisplay.length === 0 && (
          <p className="text-sm text-gray-500 italic">No features found for this tier.</p>
        )}
      </div>
    </div>
  );
}
