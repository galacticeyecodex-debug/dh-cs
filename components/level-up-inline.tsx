import React, { useState } from 'react';
import { Zap, X, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface LevelUpInlineProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  onComplete?: (options: any) => void;
}

type TabType = 'auto-changes' | 'advancements' | 'thresholds' | 'domain-card' | 'summary';

export default function LevelUpInline({ isOpen, onClose, currentLevel, onComplete }: LevelUpInlineProps) {
  const [activeTab, setActiveTab] = useState<TabType>('auto-changes');
  const newLevel = currentLevel + 1;

  if (!isOpen) return null;

  const handleApply = () => {
    if (onComplete) {
      onComplete({
        newLevel,
        selectedAdvancements: [],
        selectedDomainCardId: '',
      });
    }
    onClose();
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'auto-changes', label: 'Auto Changes', icon: '✓' },
    { id: 'advancements', label: 'Advancements', icon: '📋' },
    { id: 'thresholds', label: 'Thresholds', icon: '❤️' },
    { id: 'domain-card', label: 'Domain Card', icon: '🎴' },
    { id: 'summary', label: 'Summary', icon: '✨' },
  ];

  return (
    <div className="border-t border-dagger-gold/20 bg-gradient-to-b from-dagger-dark/80 to-black/60 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-dagger-gold" />
          <h2 className="text-xl font-bold text-white">Level Up to {newLevel}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-dagger-gold text-black'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-black/30 rounded-lg p-4 mb-4 min-h-32">
        {activeTab === 'auto-changes' && (
          <div>
            <h3 className="font-bold text-white mb-3">Automatic Changes</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-dagger-gold rounded-full" />
                <span>New Experience: +2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-dagger-gold rounded-full" />
                <span>Proficiency: +1</span>
              </div>
              {newLevel === 5 || newLevel === 8 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-dagger-gold rounded-full" />
                  <span>Clear Marked Traits</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'advancements' && (
          <div>
            <h3 className="font-bold text-white mb-3">Select Advancements (2 slots)</h3>
            <p className="text-gray-400 text-sm">
              Advancement options will appear here...
            </p>
          </div>
        )}

        {activeTab === 'thresholds' && (
          <div>
            <h3 className="font-bold text-white mb-3">Damage Thresholds</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>All thresholds increase by +1:</p>
              <div className="pl-4 space-y-1">
                <p>• Minor: 1 → 2</p>
                <p>• Major: 2 → 3</p>
                <p>• Severe: 3 → 4</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domain-card' && (
          <div>
            <h3 className="font-bold text-white mb-3">Choose Domain Card</h3>
            <p className="text-gray-400 text-sm">
              Select a new card at level {newLevel} or below...
            </p>
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <h3 className="font-bold text-white mb-3">Summary</h3>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>✓ New Experience: +2</p>
              <p>✓ Proficiency: +1</p>
              <p>✓ Damage Thresholds: +1 each</p>
              <p>✓ Domain Card: Selected</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors text-sm font-bold"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 rounded-lg bg-dagger-gold text-black hover:bg-dagger-gold/90 transition-colors text-sm font-bold flex items-center gap-2"
        >
          Apply Changes
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
