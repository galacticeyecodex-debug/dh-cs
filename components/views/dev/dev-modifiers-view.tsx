'use client';

/**
 * DEV MODIFIERS VIEW
 * ----------------------------------------------------------------------------
 * A developer tools view that dynamically discovers and displays all modifier
 * types available in the application. This view is designed to help debug
 * modifier stacking, source tracking, and condition evaluation.
 *
 * KEY DESIGN PRINCIPLE:
 * All modifier types are DYNAMICALLY DISCOVERED from actual data sources.
 * No hardcoded modifier lists - the view evolves with the app automatically.
 *
 * MODIFIER SOURCES:
 * 1. character.modifiers - User-added modifiers (keys are stat names)
 * 2. Equipped Items - From character_inventory with equipped locations
 * 3. Domain Cards - From enhanced JSON in loadout cards
 * 4. System calculations - From getSystemModifiers calls
 */

import React, { useMemo, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Code2, ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { getSystemModifiers } from '@/lib/utils';
import { getModifiers, isModifierActive } from '@/lib/enhancement-utils';
import { parseCardPassiveModifiers, calculateDynamicValue, type PassiveModifier, type ModifierCondition } from '@/lib/card-parser';
import clsx from 'clsx';
import useContentAccess from '@/hooks/useContentAccess';

import srdAbilities from '@/content/srd/json/abilities_enhanced.json';
import playtestAbilities from '@/content/playtest/json/abilities_enhanced.json';

import type { EnhancedAbilityCard } from '@/types/cards';

interface DiscoveredModifier {
    stat: string;
    value: number;
    source: string;
    sourceType: 'user' | 'equipment' | 'domain_card' | 'system';
    isActive: boolean;
    condition?: ModifierCondition;
    formula?: string;
}

interface ModifierCategory {
    name: string;
    stats: string[];
}

export default function DevModifiersView() {
    const { character, cardStates } = useCharacterStore();
    const { includePlaytest } = useContentAccess();
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['traits', 'combat', 'defensive']));

    // Memoize enhanced abilities
    const enhancedAbilities = useMemo(() => {
        const srdData = (srdAbilities || []) as EnhancedAbilityCard[];
        const playtestData = includePlaytest ? ((playtestAbilities || []) as EnhancedAbilityCard[]) : [];
        return [...srdData, ...playtestData];
    }, [includePlaytest]);

    // DYNAMIC MODIFIER DISCOVERY
    // Scan all data sources and collect every unique modifier type
    const { allModifiers, discoveredStats, categories } = useMemo(() => {
        if (!character) return { allModifiers: [], discoveredStats: new Set<string>(), categories: [] };

        const modifiers: DiscoveredModifier[] = [];
        const stats = new Set<string>();

        // Calculate total trait values for formula evaluation
        const traitsWithTotals: Record<string, number> = { ...character.stats };
        const traitNames = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];
        for (const trait of traitNames) {
            const baseStat = character.stats?.[trait as keyof typeof character.stats] || 0;
            const userMods = (character.modifiers?.[trait] || []) as { value: number }[];
            const userTotal = userMods.reduce((sum, mod) => sum + (mod.value || 0), 0);
            traitsWithTotals[trait] = baseStat + userTotal;
        }
        // Use 'as any' for parsing functions that expect Character type
        // This is necessary because traitsWithTotals has a different type than the strict stats type
        const charForParsing = { ...character, stats: traitsWithTotals } as any;

        // 1. USER-ADDED MODIFIERS (character.modifiers)
        if (character.modifiers) {
            Object.entries(character.modifiers).forEach(([stat, mods]) => {
                if (Array.isArray(mods)) {
                    stats.add(stat);
                    mods.forEach((mod: { value: number; name?: string }) => {
                        modifiers.push({
                            stat,
                            value: mod.value,
                            source: mod.name || 'User Added',
                            sourceType: 'user',
                            isActive: true,
                        });
                    });
                }
            });
        }

        // 2. EQUIPPED ITEMS
        if (character.character_inventory) {
            const equippedItems = character.character_inventory.filter((item: { location: string }) =>
                ['equipped_primary', 'equipped_secondary', 'equipped_armor'].includes(item.location)
            );

            equippedItems.forEach((item: { id: string; name: string; library_item?: { data?: { modifiers?: { target: string; value: number }[]; feature?: { text?: string }; feat_text?: string } } }) => {
                if (!item.library_item?.data) return;

                // Structured modifiers
                if (Array.isArray(item.library_item.data.modifiers)) {
                    item.library_item.data.modifiers.forEach((mod: { target: string; value: number }) => {
                        stats.add(mod.target);
                        modifiers.push({
                            stat: mod.target,
                            value: mod.value,
                            source: item.name,
                            sourceType: 'equipment',
                            isActive: true,
                        });
                    });
                }

                // Regex fallback from feature text
                const featureText = item.library_item.data.feature?.text || '';
                const featText = item.library_item.data.feat_text || '';
                const combinedText = `${featureText} ${featText}`;

                // General regex for "+X to STAT" patterns
                const regex = /([+-]?\d+)\s+(?:to|bonus\s+to)\s+(\w+)/gi;
                let match;
                while ((match = regex.exec(combinedText)) !== null) {
                    const [, valueStr, statName] = match;
                    const value = parseInt(valueStr);
                    const normalizedStat = statName.toLowerCase();
                    if (!isNaN(value)) {
                        stats.add(normalizedStat);
                        modifiers.push({
                            stat: normalizedStat,
                            value,
                            source: `${item.name} (regex)`,
                            sourceType: 'equipment',
                            isActive: true,
                        });
                    }
                }
            });
        }

        // 3. DOMAIN CARDS IN LOADOUT
        if (character.character_cards) {
            const loadoutCards = character.character_cards.filter((card: { location: string }) =>
                card.location === 'loadout'
            );

            loadoutCards.forEach((card: { id: string; library_item?: { name?: string; data?: object } }) => {
                const cardName = card.library_item?.name;
                if (!cardName) return;

                const isCardActive = cardStates?.[cardName]?.is_active ?? false;

                // Check enhanced JSON first
                const enhancedData = enhancedAbilities.find(a => a.name === cardName);
                if (enhancedData) {
                    const jsonModifiers = getModifiers(enhancedData);
                    jsonModifiers.forEach((mod, index) => {
                        stats.add(mod.stat);

                        // Evaluate condition
                        let isActive: boolean;
                        if (mod.condition?.type === 'when_active' || mod.condition?.type === 'cost_activated') {
                            const modifierKey = `${mod.stat}-${index}`;
                            isActive = cardStates?.[cardName]?.active_modifiers?.[modifierKey] ?? false;
                        } else {
                            isActive = isModifierActive(mod, isCardActive, charForParsing);
                        }

                        const calculatedValue = mod.formula
                            ? calculateDynamicValue(mod.formula, charForParsing)
                            : mod.value;

                        modifiers.push({
                            stat: mod.stat,
                            value: calculatedValue,
                            source: mod.source || cardName,
                            sourceType: 'domain_card',
                            isActive,
                            condition: mod.condition as ModifierCondition,
                            formula: mod.formula,
                        });
                    });
                }

                // Text parsing fallback
                const textModifiers = parseCardPassiveModifiers(card as any, charForParsing, isCardActive);
                textModifiers.forEach((mod: PassiveModifier) => {
                    // Avoid duplicates from JSON
                    const isDuplicate = modifiers.some(
                        m => m.stat === mod.stat && m.source === (mod.source || cardName)
                    );
                    if (!isDuplicate) {
                        stats.add(mod.stat);
                        modifiers.push({
                            stat: mod.stat,
                            value: mod.value,
                            source: mod.source || cardName,
                            sourceType: 'domain_card',
                            isActive: mod.isActive,
                            condition: mod.condition,
                            formula: mod.formula,
                        });
                    }
                });
            });
        }

        // Dynamically categorize stats
        const knownTraits = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];
        const knownCombat = ['attack', 'damage', 'proficiency', 'spellcast'];
        const knownDefensive = ['evasion', 'armor', 'armor_score'];
        const knownVitals = ['hp', 'hit_points', 'stress', 'hope'];
        const knownThresholds = ['minor_threshold', 'major_threshold', 'severe_threshold'];

        const categorizedStats = {
            traits: [] as string[],
            combat: [] as string[],
            defensive: [] as string[],
            vitals: [] as string[],
            thresholds: [] as string[],
            other: [] as string[],
        };

        stats.forEach(stat => {
            if (knownTraits.includes(stat)) categorizedStats.traits.push(stat);
            else if (knownCombat.includes(stat)) categorizedStats.combat.push(stat);
            else if (knownDefensive.includes(stat)) categorizedStats.defensive.push(stat);
            else if (knownVitals.includes(stat)) categorizedStats.vitals.push(stat);
            else if (knownThresholds.includes(stat)) categorizedStats.thresholds.push(stat);
            else categorizedStats.other.push(stat);
        });

        const categoryList: ModifierCategory[] = [
            { name: 'traits', stats: categorizedStats.traits.sort() },
            { name: 'combat', stats: categorizedStats.combat.sort() },
            { name: 'defensive', stats: categorizedStats.defensive.sort() },
            { name: 'vitals', stats: categorizedStats.vitals.sort() },
            { name: 'thresholds', stats: categorizedStats.thresholds.sort() },
            { name: 'other', stats: categorizedStats.other.sort() },
        ].filter(cat => cat.stats.length > 0);

        return { allModifiers: modifiers, discoveredStats: stats, categories: categoryList };
    }, [character, cardStates, enhancedAbilities]);

    const toggleCategory = (name: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(name)) {
            newExpanded.delete(name);
        } else {
            newExpanded.add(name);
        }
        setExpandedCategories(newExpanded);
    };

    const getModifiersForStat = (stat: string) => {
        return allModifiers.filter(m => m.stat === stat);
    };

    const getConditionLabel = (condition?: ModifierCondition): string | null => {
        if (!condition || condition.type === 'always') return null;
        switch (condition.type) {
            case 'when_active': return 'While active';
            case 'when_armored': return 'While armored';
            case 'when_unarmored': return 'While unarmored';
            case 'cost_activated': return 'Cost activated';
            case 'loadout_domain_count': return `${condition.minCount}+ ${condition.domain} cards`;
            case 'environment': return condition.requirement || 'Environment';
            default: {
                const unknownCondition = condition as { type: string };
                return unknownCondition.type ? String(unknownCondition.type) : null;
            }
        }
    };

    if (!character) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p>No character loaded</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10">
                    <Code2 size={28} className="text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-white">Dev Tools</h1>
                    <p className="text-sm text-gray-400">Modifier Inspector</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{discoveredStats.size}</div>
                    <div className="text-[10px] uppercase text-gray-500">Stats Found</div>
                </div>
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">
                        {allModifiers.filter(m => m.isActive).length}
                    </div>
                    <div className="text-[10px] uppercase text-gray-500">Active</div>
                </div>
                <div className="bg-dagger-panel border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                        {allModifiers.filter(m => !m.isActive).length}
                    </div>
                    <div className="text-[10px] uppercase text-gray-500">Inactive</div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                    <Sparkles size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="text-purple-200">
                        <strong>Dynamic Discovery:</strong> All modifier types shown here are automatically
                        discovered from your equipped items, domain cards, and user-added modifiers.
                        No hardcoded lists – the view evolves with your character.
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
                {categories.map(category => (
                    <div key={category.name} className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden">
                        <button
                            onClick={() => toggleCategory(category.name)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {expandedCategories.has(category.name) ? (
                                    <ChevronDown size={18} className="text-gray-400" />
                                ) : (
                                    <ChevronRight size={18} className="text-gray-400" />
                                )}
                                <span className="font-semibold text-white capitalize">{category.name}</span>
                                <span className="text-xs text-gray-500">({category.stats.length} stats)</span>
                            </div>
                        </button>

                        {expandedCategories.has(category.name) && (
                            <div className="border-t border-white/10 divide-y divide-white/5">
                                {category.stats.map(stat => {
                                    const mods = getModifiersForStat(stat);
                                    const activeMods = mods.filter(m => m.isActive);
                                    const total = activeMods.reduce((sum, m) => sum + m.value, 0);

                                    return (
                                        <div key={stat} className="p-4">
                                            {/* Stat Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-white capitalize">
                                                    {stat.replace(/_/g, ' ')}
                                                </span>
                                                <span className={clsx(
                                                    'font-bold text-lg',
                                                    total > 0 ? 'text-green-400' : total < 0 ? 'text-red-400' : 'text-gray-400'
                                                )}>
                                                    {total > 0 ? '+' : ''}{total}
                                                </span>
                                            </div>

                                            {/* Modifier List */}
                                            <div className="space-y-1.5">
                                                {mods.length === 0 ? (
                                                    <div className="text-xs text-gray-500 italic">No modifiers</div>
                                                ) : (
                                                    mods.map((mod, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={clsx(
                                                                'flex items-center justify-between p-2 rounded-lg text-sm',
                                                                mod.isActive ? 'bg-white/5' : 'bg-red-500/5 opacity-60'
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {mod.isActive ? (
                                                                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                                                                ) : (
                                                                    <XCircle size={14} className="text-red-400 flex-shrink-0" />
                                                                )}
                                                                <div className="min-w-0">
                                                                    <div className="text-gray-300 truncate">{mod.source}</div>
                                                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                                                        <span className={clsx(
                                                                            'text-[10px] px-1.5 py-0.5 rounded',
                                                                            mod.sourceType === 'user' && 'bg-blue-500/20 text-blue-400',
                                                                            mod.sourceType === 'equipment' && 'bg-amber-500/20 text-amber-400',
                                                                            mod.sourceType === 'domain_card' && 'bg-purple-500/20 text-purple-400',
                                                                            mod.sourceType === 'system' && 'bg-gray-500/20 text-gray-400'
                                                                        )}>
                                                                            {mod.sourceType}
                                                                        </span>
                                                                        {mod.condition && getConditionLabel(mod.condition) && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                                                                <AlertTriangle size={10} />
                                                                                {getConditionLabel(mod.condition)}
                                                                            </span>
                                                                        )}
                                                                        {mod.formula && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                                                                                {mod.formula}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className={clsx(
                                                                'font-medium',
                                                                mod.isActive
                                                                    ? mod.value > 0 ? 'text-green-400' : mod.value < 0 ? 'text-red-400' : 'text-gray-400'
                                                                    : 'text-gray-500'
                                                            )}>
                                                                {mod.value > 0 ? '+' : ''}{mod.value}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {categories.length === 0 && (
                    <div className="bg-dagger-panel border border-white/10 rounded-xl p-8 text-center text-gray-500">
                        <Code2 size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No modifiers discovered</p>
                        <p className="text-sm mt-1">Equip items or add domain cards to your loadout</p>
                    </div>
                )}
            </div>
        </div>
    );
}
