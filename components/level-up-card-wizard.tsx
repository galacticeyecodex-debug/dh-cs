import React, { useState } from 'react';
import { Zap, X, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

interface LevelUpCardWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  onComplete?: (options: any) => void;
}

type CardId = 'tier' | 'advancements' | 'thresholds' | 'domain-card';

interface CardState {
  expanded: CardId | null;
  completed: Set<CardId>;
}

export default function LevelUpCardWizard({ isOpen, onClose, currentLevel, onComplete }: LevelUpCardWizardProps) {
  const [state, setState] = useState<CardState>({
    expanded: 'tier',
    completed: new Set(),
  });

  const newLevel = currentLevel + 1;

  if (!isOpen) return null;

  const handleCardClick = (cardId: CardId) => {
    setState(prev => ({
      ...prev,
      expanded: prev.expanded === cardId ? null : cardId,
    }));
  };

  const handleCompleteCard = (cardId: CardId) => {
    setState(prev => {
      const newCompleted = new Set(prev.completed);
      if (newCompleted.has(cardId)) {
        newCompleted.delete(cardId);
      } else {
        newCompleted.add(cardId);
      }
      return { ...prev, completed: newCompleted };
    });
  };

  const allComplete = state.completed.size === 4;

  const handleFinish = () => {
    if (onComplete && allComplete) {
      onComplete({
        newLevel,
        selectedAdvancements: [],
        selectedDomainCardId: '',
      });
    }
    onClose();
  };

  const cards: { id: CardId; title: string; icon: string }[] = [
    { id: 'tier', title: 'Tier Achievements', icon: '⭐' },
    { id: 'advancements', title: 'Advancements', icon: '🎯' },
    { id: 'thresholds', title: 'Damage Thresholds', icon: '❤️' },
    { id: 'domain-card', title: 'Domain Card', icon: '🎴' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dagger-dark border border-dagger-gold/30 rounded-lg w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-dagger-gold/10 border-b border-dagger-gold/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-dagger-gold" />
            <h2 className="text-2xl font-bold text-white">Level Up to {newLevel}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cards Stack */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {cards.map((card) => {
            const isExpanded = state.expanded === card.id;
            const isCompleted = state.completed.has(card.id);

            return (
              <div
                key={card.id}
                className="border border-dagger-gold/20 rounded-lg overflow-hidden bg-black/30 transition-all"
              >
                {/* Card Header */}
                <button
                  onClick={() => handleCardClick(card.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-dagger-gold/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{card.icon}</span>
                    <span className="font-bold text-white">{card.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <div className="w-6 h-6 rounded-full bg-dagger-gold flex items-center justify-center">
                        <Check size={16} className="text-black" />
                      </div>
                    )}
                    <ChevronDown
                      size={20}
                      className={clsx(
                        'text-gray-400 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </button>

                {/* Card Content */}
                {isExpanded && (
                  <div className="border-t border-dagger-gold/10 px-4 py-4 bg-black/50 space-y-3">
                    {card.id === 'tier' && (
                      <div>
                        <p className="text-gray-300 mb-3">Automatic tier achievements:</p>
                        <ul className="space-y-2 text-gray-400 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-dagger-gold rounded-full" />
                            New Experience: +2
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-dagger-gold rounded-full" />
                            Proficiency: +1
                          </li>
                          {newLevel === 5 || newLevel === 8 ? (
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-dagger-gold rounded-full" />
                              Clear Marked Traits
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    )}

                    {card.id === 'advancements' && (
                      <div>
                        <p className="text-gray-300 mb-3">Choose 2 advancement slots:</p>
                        <p className="text-gray-400 text-sm">
                          Advancement options will appear here...
                        </p>
                      </div>
                    )}

                    {card.id === 'thresholds' && (
                      <div>
                        <p className="text-gray-300 mb-3">All thresholds increase by +1:</p>
                        <div className="space-y-1 text-gray-400 text-sm">
                          <p>• Minor: 1 → 2</p>
                          <p>• Major: 2 → 3</p>
                          <p>• Severe: 3 → 4</p>
                        </div>
                      </div>
                    )}

                    {card.id === 'domain-card' && (
                      <div>
                        <p className="text-gray-300 mb-3">
                          Select a domain card at level {newLevel} or below:
                        </p>
                        <p className="text-gray-400 text-sm">
                          Domain card selection will appear here...
                        </p>
                      </div>
                    )}

                    {/* Complete Button */}
                    <button
                      onClick={() => handleCompleteCard(card.id)}
                      className={clsx(
                        'w-full mt-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors',
                        isCompleted
                          ? 'bg-dagger-gold/20 text-dagger-gold hover:bg-dagger-gold/30'
                          : 'bg-dagger-gold text-black hover:bg-dagger-gold/90'
                      )}
                    >
                      {isCompleted ? '✓ Done' : 'Mark Complete'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-black/20 border-t border-dagger-gold/20 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors text-sm font-bold"
          >
            Cancel
          </button>
          <span className="text-sm text-gray-400">
            {state.completed.size} of 4 complete
          </span>
          <button
            onClick={handleFinish}
            disabled={!allComplete}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2',
              allComplete
                ? 'bg-dagger-gold text-black hover:bg-dagger-gold/90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            <Zap size={16} />
            Finish Leveling
          </button>
        </div>
      </div>
    </div>
  );
}
