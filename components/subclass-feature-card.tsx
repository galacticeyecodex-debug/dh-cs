'use client';

import React from 'react';
import clsx from 'clsx';
import { CharacterCard } from '@/store/character-store';

interface SubclassFeatureCardProps {
  card?: CharacterCard;
  tier: 'Foundation' | 'Specialization' | 'Mastery';
  isMulticlass: boolean;
}

export default function SubclassFeatureCard({ card, tier, isMulticlass }: SubclassFeatureCardProps) {
  if (!card?.library_item) return null;

  const isFoundation = tier === 'Foundation';

  return (
    <div className={clsx(
      "bg-dagger-panel rounded-xl p-4 relative overflow-hidden",
      isFoundation ? "border border-dagger-gold/30" : "border border-white/10"
    )}>
      {isFoundation && <div className="absolute top-0 left-0 w-1 h-full bg-dagger-gold" />}

      <div className="flex items-start justify-between">
        <h4 className={clsx(
          "font-serif font-bold mb-1",
          isFoundation ? "text-dagger-gold" : "text-white"
        )}>
          {card.library_item.name}
        </h4>

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

      {card.library_item.domain && (
        <span className="text-xs text-gray-400">
          {card.library_item.domain}
        </span>
      )}

      <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
        {card.library_item.data?.text || card.library_item.data?.description}
      </p>
    </div>
  );
}
