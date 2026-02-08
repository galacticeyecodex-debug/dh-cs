'use client';

/**
 * SORCERER ELEMENT CARD
 * ----------------------------------------------------------------------------
 * Interactive card for the Sorcerer's Elemental Origin subclass.
 * 
 * FUNCTIONALITY:
 * - Allows selection of an Elemental Origin (Air, Earth, Fire, Lightning, Water).
 * - Displays the chosen element with thematic but consistent styling.
 * - Provides visual feedback for the selected state.
 */

import { MarkdownText } from '@/components/shared/markdown-text';
import React from 'react';
import { Flame, Wind, Mountain, Droplets, Zap, Info, Sparkles } from '@/lib/icon-utils';
import { toast } from 'sonner';
import { SorcererElement } from '@/types/character';
import clsx from 'clsx';

interface SorcererElementCardProps {
    element: SorcererElement | undefined;
    description: string;
    onUpdateElement: (element: SorcererElement) => void;
}

const ELEMENTS: { id: SorcererElement; label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }[] = [
    { id: 'air', label: 'Air', icon: Wind, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
    { id: 'earth', label: 'Earth', icon: Mountain, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
    { id: 'fire', label: 'Fire', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
    { id: 'lightning', label: 'Lightning', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
    { id: 'water', label: 'Water', icon: Droplets, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
];

export default function SorcererElementCard({
    element,
    description,
    onUpdateElement,
}: SorcererElementCardProps) {
    const [showInfo, setShowInfo] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(!element);

    const selectedElement = ELEMENTS.find(e => e.id === element);

    const handleSelectElement = (elementId: SorcererElement) => {
        onUpdateElement(elementId);
        setIsEditing(false);
        toast.success(`Elemental Origin set to ${elementId.charAt(0).toUpperCase() + elementId.slice(1)}`);
    };

    return (
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-dagger-gold" /> Elementalist
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label={showInfo ? "Hide element info" : "Show element info"}
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
                {/* Selected Element Display */}
                {selectedElement && !isEditing ? (
                    <div className="rounded-lg p-4 border border-white/10 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-12 h-12 rounded-lg flex items-center justify-center border border-white/5",
                                "bg-black/40"
                            )}>
                                <selectedElement.icon size={28} className={selectedElement.color} />
                            </div>
                            <div className="flex-1">
                                <div className={clsx("text-lg font-serif font-bold", selectedElement.color)}>
                                    {selectedElement.label}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Your chosen elemental origin
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Element Selection Grid */
                    <div className="space-y-2">
                        <p className="text-sm text-dagger-gold font-medium">
                            Choose your elemental origin:
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {ELEMENTS.map((el) => {
                                const IconComponent = el.icon;
                                const isSelected = element === el.id;
                                return (
                                    <button
                                        key={el.id}
                                        onClick={() => handleSelectElement(el.id)}
                                        className={clsx(
                                            "p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all border",
                                            isSelected
                                                ? "bg-dagger-gold/20 border-dagger-gold shadow-lg"
                                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <IconComponent
                                            size={20}
                                            className={isSelected ? "text-dagger-gold" : "text-gray-500"}
                                        />
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            isSelected ? "text-white" : "text-gray-500"
                                        )}>
                                            {el.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {isEditing && element && (
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-xs text-gray-500 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
