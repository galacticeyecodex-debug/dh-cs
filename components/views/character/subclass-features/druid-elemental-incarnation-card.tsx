'use client';

/**
 * DRUID ELEMENTAL INCARNATION CARD
 * ----------------------------------------------------------------------------
 * Interactive card for the Druid's Warden of the Elements subclass.
 * 
 * FUNCTIONALITY:
 * - Allows channeling an element (Fire, Earth, Water, Air).
 * - Tracks active state (Channeling vs Idle).
 * - Displays element-specific benefits and visual indicators.
 * - Handles ending the effect (Severe damage or Rest).
 */

import { MarkdownText } from '@/components/shared/markdown-text';
import React from 'react';
import { Flame, Wind, Mountain, Droplets, X, Info, Sparkles } from '@/lib/icon-utils';
import { toast } from 'sonner';
import { DruidElementalIncarnation, DruidElement } from '@/types/character';
import clsx from 'clsx';

interface ElementalIncarnationCardProps {
    incarnation: DruidElementalIncarnation | undefined;
    description: string;
    onUpdateIncarnation: (data: DruidElementalIncarnation) => void;
}

const ELEMENTS: {
    id: DruidElement;
    label: string;
    icon: React.ElementType;
    color: string;
    benefit: string;
}[] = [
        {
            id: 'fire',
            label: 'Fire',
            icon: Flame,
            color: 'text-orange-400',
            benefit: 'When an adversary within Melee range deals damage to you, they take 1d10 magic damage.'
        },
        {
            id: 'earth',
            label: 'Earth',
            icon: Mountain,
            color: 'text-amber-400',
            benefit: 'Gain a bonus to your damage thresholds equal to your Proficiency.'
        },
        {
            id: 'water',
            label: 'Water',
            icon: Droplets,
            color: 'text-blue-400',
            benefit: 'When you deal damage to an adversary within Melee range, all other adversaries within Very Close range must mark a Stress.'
        },
        {
            id: 'air',
            label: 'Air',
            icon: Wind,
            color: 'text-cyan-400',
            benefit: 'You can hover, gaining advantage on Agility Rolls.'
        },
    ];

export default function ElementalIncarnationCard({
    incarnation,
    description,
    onUpdateIncarnation,
}: ElementalIncarnationCardProps) {
    const [showInfo, setShowInfo] = React.useState(false);

    const isActive = incarnation?.is_active || false;
    const selectedElement = ELEMENTS.find(e => e.id === incarnation?.selected_element);

    const handleChannel = (element: DruidElement) => {
        onUpdateIncarnation({
            is_active: true,
            selected_element: element
        });
        const el = ELEMENTS.find(e => e.id === element);
        toast.success(`Channeling ${el?.label}! (Mark 1 Stress)`);
    };

    const handleEndChannel = () => {
        onUpdateIncarnation({
            is_active: false,
            selected_element: undefined
        });
        toast.info('Elemental channeling ended.');
    };

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-dagger-gold" /> Elemental Incarnation
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label={showInfo ? "Hide incarnation info" : "Show incarnation info"}
                >
                    <Info size={14} className={showInfo ? "text-dagger-gold" : "text-gray-400"} />
                </button>
            </div>

            {/* Info Section */}
            {showInfo && (
                <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-300">
                    <MarkdownText>
                        {description}
                    </MarkdownText>
                </div>
            )}

            <div className="space-y-3">
                {/* Active State */}
                {isActive && selectedElement ? (
                    <div className="rounded-lg p-4 border border-dagger-gold/50 bg-dagger-gold/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/40 border border-white/10">
                                <selectedElement.icon size={28} className={selectedElement.color} />
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-serif font-bold text-white">
                                    Channeling {selectedElement.label}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Until Severe damage or rest
                                </div>
                            </div>
                        </div>

                        {/* Active Benefit */}
                        <div className="p-3 bg-black/20 rounded-lg border border-white/5 mb-3">
                            <div className="text-xs font-bold text-dagger-gold uppercase tracking-wider mb-1">
                                Current Benefit
                            </div>
                            <div className="text-sm text-gray-300">
                                {selectedElement.benefit}
                            </div>
                        </div>

                        <button
                            onClick={handleEndChannel}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <X size={14} /> End Channeling
                        </button>
                    </div>
                ) : (
                    /* Element Selection Grid */
                    <div className="space-y-2">
                        <p className="text-sm text-dagger-gold font-medium">
                            Mark a Stress to channel an element:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {ELEMENTS.map((el) => {
                                const IconComponent = el.icon;
                                return (
                                    <button
                                        key={el.id}
                                        onClick={() => handleChannel(el.id)}
                                        className="p-3 rounded-lg flex items-center gap-3 transition-all border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/30 border border-white/5 group-hover:border-white/10">
                                            <IconComponent size={20} className={el.color} />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="font-bold text-sm text-gray-200 group-hover:text-white">
                                                {el.label}
                                            </div>
                                            <div className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                                                {el.benefit.substring(0, 40)}...
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
