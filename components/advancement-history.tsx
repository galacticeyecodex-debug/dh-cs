'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Eye, EyeOff, Heart, Zap, Shield, Star, Swords } from 'lucide-react';
import { AdvancementRecord } from '@/store/character-store';
import { Experience } from '@/types/modifiers';

interface AdvancementHistoryProps {
  advancementHistory: Record<string, AdvancementRecord>;
  experiences?: Experience[];
}

const ADVANCEMENT_NAMES: Record<string, string> = {
  increase_traits: 'Traits',
  add_hp: 'Hit Points',
  add_stress: 'Stress',
  increase_experience: 'Experience',
  domain_card: 'Domain Card',
  increase_evasion: 'Evasion',
  subclass_card: 'Subclass',
  increase_proficiency: 'Proficiency',
};

export default function AdvancementHistory({ advancementHistory, experiences = [] }: AdvancementHistoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Hidden by default
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
          Advancement History
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded"
        >
          {!isCollapsed ? <EyeOff size={14} /> : <Eye size={14} />}
          {!isCollapsed ? 'Hide' : 'Show'}
        </button>
      </div>

      {!isCollapsed && (
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
                      • {record.advancements.length} upgrades
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.advancements.slice(0, 3).map((adv, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5"
                      >
                        {ADVANCEMENT_NAMES[adv] || adv}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-3 bg-black/20 space-y-2 text-sm">
                    
                    {/* Trait Increments */}
                    {record.traitIncrements && record.traitIncrements.length > 0 && (
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-dagger-gold"><Star size={14} /></div>
                        <div className="text-gray-300">
                          <span className="font-bold text-white">Traits: </span>
                          {record.traitIncrements.map((inc, i) => (
                            <span key={i}>
                              {i > 0 && ', '}
                              <span className="capitalize">{inc.trait}</span> (+{inc.amount})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Increments */}
                    {record.experienceIncrements && record.experienceIncrements.length > 0 && (
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-blue-400"><Swords size={14} /></div>
                        <div className="text-gray-300">
                          <span className="font-bold text-white">Experiences: </span>
                          {record.experienceIncrements.map((inc, i) => {
                            const expIndex = parseInt(inc.experienceId);
                            const expName = experiences[expIndex]?.name || `Experience #${expIndex + 1}`;
                            return (
                              <span key={i}>
                                {i > 0 && ', '}
                                {expName} (+{inc.amount})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* HP Added */}
                    {record.hpAdded && record.hpAdded > 0 && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Heart size={14} className="text-red-400" />
                        <span>
                          <strong className="text-white">Hit Points:</strong> +{record.hpAdded} slots
                        </span>
                      </div>
                    )}

                    {/* Stress Added */}
                    {record.stressAdded && record.stressAdded > 0 && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Zap size={14} className="text-purple-400" />
                        <span>
                          <strong className="text-white">Stress:</strong> +{record.stressAdded} slots
                        </span>
                      </div>
                    )}

                    {/* Domain Card Selected */}
                    {record.domainCardSelected && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Shield size={14} className="text-dagger-gold" />
                        <span>
                          <strong className="text-white">New Card:</strong> {record.domainCardSelected}
                        </span>
                      </div>
                    )}
                    
                    {/* Other Advancements (e.g., Evasion, Proficiency) */}
                    {record.advancements.includes('increase_evasion') && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Eye size={14} className="text-cyan-400" />
                        <span>
                          <strong className="text-white">Evasion:</strong> +1
                        </span>
                      </div>
                    )}
                    
                    {record.advancements.includes('increase_proficiency') && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Check size={14} className="text-dagger-gold" />
                        <span>
                          <strong className="text-white">Proficiency:</strong> +1 Damage Die
                        </span>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
