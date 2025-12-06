'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface CharacterCard {
  id: string;
  card_id: string;
  location: 'loadout' | 'vault' | 'feature';
  library_item?: {
    id: string;
    name: string;
    type: string;
    domain?: string;
    level?: number;
    data?: {
      level?: number;
      description?: string;
    };
  };
}

interface LibraryItem {
  id: string;
  name: string;
  type: string;
  domain?: string;
  level?: number;
  data?: {
    level?: number;
    description?: string;
  };
}

interface DomainExchangeProps {
  selectedNewCard: LibraryItem;
  characterCards: CharacterCard[];
  onSelectExchangeCard: (cardId: string | null) => void;
}

export default function DomainExchange({
  selectedNewCard,
  characterCards,
  onSelectExchangeCard,
}: DomainExchangeProps) {
  const [isExchangeEnabled, setIsExchangeEnabled] = useState(false);
  const [selectedExistingCardId, setSelectedExistingCardId] = useState<string | null>(null);

  const newCardLevel = selectedNewCard.data?.level || selectedNewCard.level || 1;
  const newCardDomain = selectedNewCard.domain?.trim().toLowerCase();

  // Filter existing cards that match the domain and have level >= new card level
  const eligibleCards = characterCards.filter((card) => {
    const cardDomain = card.library_item?.domain?.trim().toLowerCase();
    const cardLevel = card.library_item?.data?.level || card.library_item?.level || 1;

    // Must be from same domain
    if (cardDomain !== newCardDomain) return false;

    // Existing card must be same or higher level (can exchange higher for lower)
    if (cardLevel < newCardLevel) return false;

    return true;
  });

  const handleToggleExchange = () => {
    const newEnabled = !isExchangeEnabled;
    setIsExchangeEnabled(newEnabled);

    if (!newEnabled) {
      setSelectedExistingCardId(null);
      onSelectExchangeCard(null);
    }
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedExistingCardId(cardId);
    onSelectExchangeCard(cardId);
  };

  // If no eligible cards, don't show the exchange option
  if (eligibleCards.length === 0) {
    return null;
  }

  const selectedCard = eligibleCards.find(c => c.id === selectedExistingCardId);

  return (
    <div className="mt-4 p-4 bg-black/30 rounded-lg border border-gray-600">
      {/* Toggle */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={handleToggleExchange}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            isExchangeEnabled ? 'bg-dagger-gold' : 'bg-gray-600'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              isExchangeEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm font-bold text-white cursor-pointer" onClick={handleToggleExchange}>
          Exchange existing card for this one
        </label>
      </div>

      {/* Card Selection */}
      {isExchangeEnabled && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            Select an existing {selectedNewCard.domain} card to exchange (must be level {newCardLevel} or higher)
          </p>
          <div className="space-y-2">
            {eligibleCards.map((card) => {
              const isSelected = selectedExistingCardId === card.id;
              const cardLevel = card.library_item?.data?.level || card.library_item?.level || 1;
              const cardDescription = card.library_item?.data?.description || '';

              return (
                <button
                  key={card.id}
                  onClick={() => handleSelectCard(card.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-dagger-gold bg-dagger-gold/10'
                      : 'border-gray-600 bg-black/30 hover:border-dagger-gold/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-white">{card.library_item?.name}</p>
                      <p className="text-xs text-gray-400 mb-1">
                        {card.library_item?.type} • Level {cardLevel} • {card.location}
                      </p>
                      {cardDescription && (
                        <p className="text-xs text-gray-300 line-clamp-2">
                          {cardDescription}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-xs bg-dagger-gold text-black px-2 py-1 rounded-full font-bold flex-shrink-0 mt-0.5">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          {selectedCard && (
            <div className="mt-3 p-3 bg-dagger-gold/10 border border-dagger-gold/30 rounded-lg">
              <p className="text-xs text-gray-300 flex items-center gap-2">
                <span className="font-bold text-white">Remove:</span>
                {selectedCard.library_item?.name}
                <ArrowRight size={14} className="text-dagger-gold" />
                <span className="font-bold text-white">Add:</span>
                {selectedNewCard.name}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
