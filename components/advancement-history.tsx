'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { AdvancementRecord } from '@/store/character-store';

interface AdvancementHistoryProps {
  advancementHistory: Record<string, AdvancementRecord>;
}

const ADVANCEMENT_NAMES: Record<string, string> = {
  increase_traits: 'Increase Traits',
  add_hp: 'Add HP',
  add_stress: 'Add Stress',
  increase_experience: 'Increase Experience',
  domain_card: 'Additional Domain Card',
  increase_evasion: 'Increase Evasion',
  subclass_card: 'Upgraded Subclass Card',
  increase_proficiency: 'Increase Proficiency',
};

export default function AdvancementHistory({ advancementHistory }: AdvancementHistoryProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());

  if (!advancementHistory || Object.keys(advancementHistory).length === 0) {
    return (
      <div className="text-gray-500 text-sm italic text-center p-4 bg-black/20 rounded-lg border border-white/10">
        No advancement history yet. Level up to see your progression!
      </div>
    );
  }

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const levels = Object.keys(advancementHistory)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
        Advancement History
      </h3>

      <div className="space-y-2">
        {levels.map((level) => {
          const record = advancementHistory[String(level)];
          const isExpanded = expandedLevels.has(level);

          return (
            <div
              key={level}
              className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-dagger-gold" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="font-bold text-white">Level {level}</span>
                  <span className="text-xs text-gray-500">
                    ({record.advancements.length} advancement{record.advancements.length > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {record.advancements.slice(0, 2).map((adv, i) => (
                    <span
                      key={i}
                      className="text-xs bg-dagger-gold/20 text-dagger-gold px-2 py-0.5 rounded"
                    >
                      {ADVANCEMENT_NAMES[adv] || adv}
                    </span>
                  ))}
                  {record.advancements.length > 2 && (
                    <span className="text-xs text-gray-400">
                      +{record.advancements.length - 2} more
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 bg-black/20 space-y-3">
                  {/* Advancements */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Advancements Selected
                    </h4>
                    <div className="space-y-1">
                      {record.advancements.map((adv, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check size={14} className="text-dagger-gold" />
                          <span className="text-gray-300">{ADVANCEMENT_NAMES[adv] || adv}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trait Increments */}
                  {record.traitIncrements && record.traitIncrements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Traits Increased
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {record.traitIncrements.map((inc, i) => (
                          <span
                            key={i}
                            className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30"
                          >
                            {inc.trait.charAt(0).toUpperCase() + inc.trait.slice(1)} +{inc.amount}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Increments */}
                  {record.experienceIncrements && record.experienceIncrements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Experiences Increased
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {record.experienceIncrements.map((inc, i) => (
                          <span
                            key={i}
                            className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30"
                          >
                            Experience #{inc.experienceId} +{inc.amount}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HP Added */}
                  {record.hpAdded && record.hpAdded > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Hit Points Added
                      </h4>
                      <span className="text-sm bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30">
                        +{record.hpAdded} HP slots
                      </span>
                    </div>
                  )}

                  {/* Stress Added */}
                  {record.stressAdded && record.stressAdded > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Stress Added
                      </h4>
                      <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                        +{record.stressAdded} Stress slots
                      </span>
                    </div>
                  )}

                  {/* Domain Card Selected */}
                  {record.domainCardSelected && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Domain Card Acquired
                      </h4>
                      <span className="text-sm bg-dagger-gold/20 text-dagger-gold px-2 py-1 rounded border border-dagger-gold/30">
                        {record.domainCardSelected}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
