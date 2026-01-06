'use client';

import { MarkdownText } from '@/components/shared/markdown-text';
import React from 'react';
import { HelpingHand, Info } from 'lucide-react';
import { WizardStrangePatterns } from '@/types/character';
import { toast } from 'sonner';
import clsx from 'clsx';

interface StrangePatternsCardProps {
    strangePatterns: WizardStrangePatterns | undefined;
    description: string;
    onUpdateStrangePatterns: (data: WizardStrangePatterns) => void;
}

export default function StrangePatternsCard({
    strangePatterns,
    description,
    onUpdateStrangePatterns,
}: StrangePatternsCardProps) {
    const [showInfo, setShowInfo] = React.useState(false);

    const selectedNumber = strangePatterns?.target_number || 0;

    const handleSelect = (num: number) => {
        onUpdateStrangePatterns({ target_number: num });
        toast.success(`Strange Pattern set to ${num}`);
    };

    return (
        <div className="bg-dagger-panel border border-dagger-gold/30 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>

            <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-gray-200 flex items-center gap-2">
                    <HelpingHand size={14} className="text-purple-400" /> Strange Patterns
                </h4>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <Info size={14} className={showInfo ? "text-dagger-gold" : "text-gray-400"} />
                </button>
            </div>

            {showInfo && (
                <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-400">
                    <MarkdownText>
                        {description}
                    </MarkdownText>
                </div>
            )}

            <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <button
                        key={num}
                        onClick={() => handleSelect(num)}
                        className={clsx(
                            "h-8 rounded font-bold text-sm transition-all border",
                            selectedNumber === num
                                ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] scale-105"
                                : "bg-black/40 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {num}
                    </button>
                ))}
            </div>

            <div className="mt-3 text-center text-xs text-gray-500">
                {selectedNumber > 0 ? (
                    <span>Current Target: <strong className="text-purple-400">{selectedNumber}</strong></span>
                ) : (
                    "Select a number for today"
                )}
            </div>
        </div>
    );
}
